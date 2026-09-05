import { prisma } from '../config/db.js';
import { postCustomerPayment, postSale } from '../services/accountingService.js';

const numberValue = value => Number(value || 0);
const numberFor = prefix => `${prefix}-${new Date().getFullYear()}-${Date.now()}`;
const calculateTotals = items => items.reduce((result, item) => {
  const subtotal = numberValue(item.quantity) * numberValue(item.unitPrice);
  const tax = subtotal * numberValue(item.taxRate) / 100;
  return { subtotal: result.subtotal + subtotal, tax: result.tax + tax, total: result.total + subtotal + tax };
}, { subtotal: 0, tax: 0, total: 0 });
const paidTotal = allocations => allocations.reduce((sum, allocation) => sum + numberValue(allocation.amount), 0);
const invoiceInclude = { customer: true, salesOrder: { include: { items: { include: { product: true } } } }, paymentAllocations: true };

function validateItems(items) {
  if (!Array.isArray(items) || !items.length) return 'Add at least one product to the sales order.';
  if (items.some(item => !item.productId || numberValue(item.quantity) <= 0 || numberValue(item.unitPrice) < 0 || numberValue(item.taxRate) < 0)) return 'Each line needs a product, positive quantity, and valid price.';
  return null;
}

function publicInvoice(invoice) {
  const paid = paidTotal(invoice.paymentAllocations);
  return { ...invoice, paid, outstanding: Math.max(0, numberValue(invoice.total) - paid) };
}

export async function listSalesOrders(_request, response) {
  const orders = await prisma.salesOrder.findMany({ include: { customer: true, items: { include: { product: true } }, invoice: true }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: orders });
}

export async function createSalesOrder(request, response) {
  const { customerId, orderDate, notes, items } = request.body;
  const validation = validateItems(items);
  if (!customerId || validation) return response.status(400).json({ success: false, message: validation || 'Customer is required.' });
  const customer = await prisma.contact.findFirst({ where: { id: customerId, type: { in: ['CUSTOMER', 'BOTH'] }, isActive: true } });
  if (!customer) return response.status(400).json({ success: false, message: 'Select an active customer contact.' });
  const totals = calculateTotals(items);
  const order = await prisma.salesOrder.create({ data: { orderNumber: numberFor('SO'), customerId, orderDate: orderDate ? new Date(orderDate) : new Date(), status: 'DRAFT', subtotal: totals.subtotal, tax: totals.tax, total: totals.total, notes: notes?.trim() || null, createdById: request.user.id, items: { create: items.map(item => ({ productId: item.productId, quantity: numberValue(item.quantity), unitPrice: numberValue(item.unitPrice), taxRate: numberValue(item.taxRate), total: numberValue(item.quantity) * numberValue(item.unitPrice) * (1 + numberValue(item.taxRate) / 100) })) } }, include: { customer: true, items: { include: { product: true } } } });
  response.status(201).json({ success: true, data: order, message: 'Sales order saved as draft.' });
}

export async function confirmSalesOrder(request, response) {
  const order = await prisma.salesOrder.update({ where: { id: request.params.id }, data: { status: 'CONFIRMED' }, include: { customer: true, items: { include: { product: true } }, invoice: true } });
  response.json({ success: true, data: order, message: 'Sales order confirmed.' });
}

export async function listSalesInvoices(_request, response) {
  const invoices = await prisma.salesInvoice.findMany({ include: invoiceInclude, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: invoices.map(publicInvoice) });
}

export async function createSalesInvoice(request, response) {
  const { invoiceDate, dueDate, notes } = request.body;
  const invoice = await prisma.$transaction(async transaction => {
    const order = await transaction.salesOrder.findUnique({ where: { id: request.params.id }, include: { invoice: true } });
    if (!order) throw Object.assign(new Error('Sales order not found.'), { statusCode: 404 });
    if (order.status !== 'CONFIRMED') throw Object.assign(new Error('Confirm the sales order before creating an invoice.'), { statusCode: 400 });
    if (order.invoice) throw Object.assign(new Error('This sales order already has an invoice.'), { statusCode: 409 });
    return transaction.salesInvoice.create({ data: { invoiceNumber: numberFor('INV'), salesOrderId: order.id, customerId: order.customerId, invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(), dueDate: dueDate ? new Date(dueDate) : null, subtotal: order.subtotal, tax: order.tax, total: order.total, status: 'DRAFT', notes: notes?.trim() || null, createdById: request.user.id }, include: invoiceInclude });
  });
  response.status(201).json({ success: true, data: publicInvoice(invoice), message: 'Customer invoice created from sales order.' });
}

export async function confirmSalesInvoice(request, response) {
  const invoice = await prisma.$transaction(async transaction => {
    const current = await transaction.salesInvoice.findUnique({ where: { id: request.params.id }, include: { customer: true, paymentAllocations: true } });
    if (!current) throw Object.assign(new Error('Customer invoice not found.'), { statusCode: 404 });
    if (current.status !== 'DRAFT') throw Object.assign(new Error('Only draft invoices can be confirmed.'), { statusCode: 400 });
    const confirmed = await transaction.salesInvoice.update({ where: { id: current.id }, data: { status: 'CONFIRMED' }, include: invoiceInclude });
    await postSale(transaction, { reference: confirmed.invoiceNumber, description: `Customer invoice for ${confirmed.customer.name}`, partnerId: confirmed.customerId, amount: confirmed.total, createdById: request.user.id });
    return confirmed;
  });
  response.json({ success: true, data: publicInvoice(invoice), message: 'Invoice confirmed and journal entry posted.' });
}

export async function registerCustomerPayment(request, response) {
  const { amount, method, paymentDate, reference, notes } = request.body;
  const paymentAmount = numberValue(amount);
  if (paymentAmount <= 0 || !['CASH', 'BANK'].includes(method)) return response.status(400).json({ success: false, message: 'Enter a valid amount and choose Cash or Bank.' });
  const result = await prisma.$transaction(async transaction => {
    const invoice = await transaction.salesInvoice.findUnique({ where: { id: request.params.id }, include: { paymentAllocations: true, customer: true } });
    if (!invoice) throw Object.assign(new Error('Customer invoice not found.'), { statusCode: 404 });
    if (invoice.status === 'DRAFT') throw Object.assign(new Error('Confirm the invoice before recording payment.'), { statusCode: 400 });
    const outstanding = numberValue(invoice.total) - paidTotal(invoice.paymentAllocations);
    if (paymentAmount > outstanding + 0.005) throw Object.assign(new Error('Payment exceeds the invoice amount due.'), { statusCode: 400 });
    const payment = await transaction.payment.create({ data: { paymentNumber: numberFor('PAY'), amount: paymentAmount, paymentDate: paymentDate ? new Date(paymentDate) : new Date(), method, status: 'CONFIRMED', reference: reference?.trim() || null, notes: notes?.trim() || null, customerId: invoice.customerId, createdById: request.user.id, allocations: { create: { amount: paymentAmount, salesInvoiceId: invoice.id } } } });
    const nextPaid = paidTotal(invoice.paymentAllocations) + paymentAmount;
    const nextStatus = nextPaid >= numberValue(invoice.total) - 0.005 ? 'PAID' : 'PARTIALLY_PAID';
    await transaction.salesInvoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
    await postCustomerPayment(transaction, { reference: payment.paymentNumber, description: `Payment for ${invoice.invoiceNumber}`, partnerId: invoice.customerId, amount: paymentAmount, method, createdById: request.user.id });
    return payment;
  });
  response.status(201).json({ success: true, data: result, message: 'Customer payment recorded and journal entry posted.' });
}