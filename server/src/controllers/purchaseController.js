import { prisma } from '../config/db.js';

const n = value => Number(value || 0);
const totalsFor = items => items.reduce((result, item) => {
  const base = n(item.quantity) * n(item.unitPrice);
  const tax = base * n(item.taxRate) / 100;
  return { subtotal: result.subtotal + base, tax: result.tax + tax, total: result.total + base + tax };
}, { subtotal: 0, tax: 0, total: 0 });
const numberFor = prefix => `${prefix}-${new Date().getFullYear()}-${Date.now()}`;
const paymentTotal = allocations => allocations.reduce((sum, item) => sum + n(item.amount), 0);

async function postEntry(transaction, { journalType, reference, description, partnerId, debitName, creditName, amount, debitAccountId, creditAccountId }) {
  const journal = await transaction.journal.findFirst({ where: { type: journalType } });
  const debit = debitAccountId ? await transaction.account.findUnique({ where: { id: debitAccountId } }) : await transaction.account.findFirst({ where: { name: { contains: debitName, mode: 'insensitive' }, isActive: true } });
  const credit = creditAccountId ? await transaction.account.findUnique({ where: { id: creditAccountId } }) : await transaction.account.findFirst({ where: { name: { contains: creditName, mode: 'insensitive' }, isActive: true } });
  if (!journal || !debit || !credit) return null;
  return transaction.journalEntry.create({ data: { journalId: journal.id, date: new Date(), reference, description, status: 'POSTED', items: { create: [{ accountId: debit.id, partnerId, debit: amount, credit: 0 }, { accountId: credit.id, partnerId, debit: 0, credit: amount }] } } });
}

function validateOrder({ vendorId, items }) {
  if (!vendorId || !Array.isArray(items) || !items.length) return 'Vendor and at least one product are required.';
  if (items.some(item => !item.productId || n(item.quantity) <= 0 || n(item.unitPrice) < 0 || n(item.taxRate) < 0)) return 'Each item needs a product, positive quantity, and valid prices.';
  return null;
}

export async function listPurchaseOrders(request, response) {
  const orders = await prisma.purchaseOrder.findMany({ include: { vendor: true, items: { include: { product: true } }, bill: true }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: orders });
}

export async function createPurchaseOrder(request, response) {
  const { vendorId, orderDate, notes, items } = request.body;
  const validation = validateOrder({ vendorId, items });
  if (validation) return response.status(400).json({ success: false, message: validation });
  const vendor = await prisma.contact.findFirst({ where: { id: vendorId, type: { in: ['VENDOR', 'BOTH'] }, isActive: true } });
  if (!vendor) return response.status(400).json({ success: false, message: 'Select an active vendor contact.' });
  const totals = totalsFor(items);
  const order = await prisma.$transaction(transaction => transaction.purchaseOrder.create({ data: { orderNumber: numberFor('PO'), vendorId, orderDate: orderDate ? new Date(orderDate) : new Date(), status: 'CONFIRMED', subtotal: totals.subtotal, tax: totals.tax, total: totals.total, notes: notes?.trim() || null, createdById: request.user.id, items: { create: items.map(item => ({ productId: item.productId, quantity: n(item.quantity), unitPrice: n(item.unitPrice), taxRate: n(item.taxRate), total: n(item.quantity) * n(item.unitPrice) * (1 + n(item.taxRate) / 100) })) } }, include: { vendor: true, items: { include: { product: true } } } }));
  response.status(201).json({ success: true, data: order, message: 'Purchase order created.' });
}

export async function listVendorBills(_request, response) {
  const bills = await prisma.vendorBill.findMany({ include: { vendor: true, purchaseOrder: { include: { items: { include: { product: true } } } }, paymentAllocations: true }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: bills.map(bill => ({ ...bill, paid: paymentTotal(bill.paymentAllocations), outstanding: Math.max(0, n(bill.total) - paymentTotal(bill.paymentAllocations)) })) });
}

export async function createVendorBill(request, response) {
  const { purchaseOrderId, invoiceDate, dueDate, notes } = request.body;
  const bill = await prisma.$transaction(async transaction => {
    const order = await transaction.purchaseOrder.findUnique({ where: { id: purchaseOrderId }, include: { bill: true, items: true } });
    if (!order) throw Object.assign(new Error('Purchase order not found.'), { statusCode: 404 });
    if (order.bill) throw Object.assign(new Error('This purchase order already has a vendor bill.'), { statusCode: 409 });
    const created = await transaction.vendorBill.create({ data: { billNumber: numberFor('BILL'), purchaseOrderId: order.id, vendorId: order.vendorId, invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(), dueDate: dueDate ? new Date(dueDate) : null, subtotal: order.subtotal, tax: order.tax, total: order.total, status: 'CONFIRMED', notes: notes?.trim() || null, createdById: request.user.id }, include: { vendor: true, purchaseOrder: { include: { items: { include: { product: true } } } }, paymentAllocations: true } });
    await transaction.purchaseOrder.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });
    await postEntry(transaction, { journalType: 'PURCHASE', reference: created.billNumber, description: `Vendor bill for ${created.vendor.name}`, partnerId: created.vendorId, debitName: 'Purchase Expense', creditName: 'Accounts Payable', amount: created.total });
    return created;
  });
  response.status(201).json({ success: true, data: bill, message: 'Vendor bill created from purchase order.' });
}

export async function registerVendorPayment(request, response) {
  const { amount, method, paymentDate, reference, notes } = request.body;
  const paymentAmount = n(amount);
  if (paymentAmount <= 0 || !['CASH', 'BANK'].includes(method)) return response.status(400).json({ success: false, message: 'Enter a valid amount and choose Cash or Bank.' });
  const result = await prisma.$transaction(async transaction => {
    const bill = await transaction.vendorBill.findUnique({ where: { id: request.params.id }, include: { paymentAllocations: true, vendor: true } });
    if (!bill) throw Object.assign(new Error('Vendor bill not found.'), { statusCode: 404 });
    const outstanding = n(bill.total) - paymentTotal(bill.paymentAllocations);
    if (paymentAmount > outstanding + 0.005) throw Object.assign(new Error('Payment exceeds the bill outstanding amount.'), { statusCode: 400 });
    const payment = await transaction.payment.create({ data: { paymentNumber: numberFor('PAY'), amount: paymentAmount, paymentDate: paymentDate ? new Date(paymentDate) : new Date(), method, status: 'CONFIRMED', reference: reference?.trim() || null, notes: notes?.trim() || null, vendorId: bill.vendorId, createdById: request.user.id, allocations: { create: { amount: paymentAmount, vendorBillId: bill.id } } } });
    const nextStatus = paymentAmount >= outstanding - 0.005 ? 'PAID' : 'PARTIALLY_PAID';
    await transaction.vendorBill.update({ where: { id: bill.id }, data: { status: nextStatus } });
    const bankName = method === 'BANK' ? 'Bank' : 'Cash';
    await postEntry(transaction, { journalType: method, reference: payment.paymentNumber, description: `Payment for ${bill.billNumber}`, partnerId: bill.vendorId, debitName: 'Accounts Payable', creditName: bankName, amount: paymentAmount });
    return payment;
  });
  response.status(201).json({ success: true, data: result, message: 'Vendor payment recorded.' });
}
