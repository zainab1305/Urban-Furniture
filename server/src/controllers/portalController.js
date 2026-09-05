import { prisma } from '../config/db.js';

const numeric = value => Number(value || 0);
const allocationTotal = allocations => allocations.reduce((sum, allocation) => sum + numeric(allocation.amount), 0);

function requireContact(request, response) {
  if (!request.user.contactId) {
    response.status(403).json({ success: false, message: 'This account is not linked to a contact.' });
    return null;
  }
  return request.user.contactId;
}

export async function dashboard(request, response) {
  const contactId = requireContact(request, response);
  if (!contactId) return;
  const [invoices, bills, payments] = await Promise.all([
    prisma.salesInvoice.findMany({ where: { customerId: contactId }, include: { allocations: true }, orderBy: { invoiceDate: 'desc' } }),
    prisma.vendorBill.findMany({ where: { vendorId: contactId }, include: { allocations: true }, orderBy: { invoiceDate: 'desc' } }),
    prisma.payment.findMany({ where: { OR: [{ customerId: contactId }, { vendorId: contactId }] }, include: { allocations: true }, orderBy: { paymentDate: 'desc' } })
  ]);
  response.json({ success: true, data: {
    invoices: invoices.map(invoice => ({ ...invoice, paid: allocationTotal(invoice.allocations), outstanding: Math.max(0, numeric(invoice.total) - allocationTotal(invoice.allocations)) })),
    bills: bills.map(bill => ({ ...bill, paid: allocationTotal(bill.allocations), outstanding: Math.max(0, numeric(bill.total) - allocationTotal(bill.allocations)) })),
    payments
  } });
}

export async function invoice(request, response) {
  const contactId = requireContact(request, response);
  if (!contactId) return;
  const record = await prisma.salesInvoice.findFirst({ where: { id: request.params.id, customerId: contactId }, include: { allocations: true, salesOrder: { include: { items: { include: { product: true } } } } } });
  if (!record) return response.status(404).json({ success: false, message: 'Invoice not found.' });
  response.json({ success: true, data: { ...record, paid: allocationTotal(record.allocations), outstanding: Math.max(0, numeric(record.total) - allocationTotal(record.allocations)) } });
}

export async function bill(request, response) {
  const contactId = requireContact(request, response);
  if (!contactId) return;
  const record = await prisma.vendorBill.findFirst({ where: { id: request.params.id, vendorId: contactId }, include: { allocations: true, purchaseOrder: { include: { items: { include: { product: true } } } } } });
  if (!record) return response.status(404).json({ success: false, message: 'Bill not found.' });
  response.json({ success: true, data: { ...record, paid: allocationTotal(record.allocations), outstanding: Math.max(0, numeric(record.total) - allocationTotal(record.allocations)) } });
}

export async function payments(request, response) {
  const contactId = requireContact(request, response);
  if (!contactId) return;
  const records = await prisma.payment.findMany({ where: { OR: [{ customerId: contactId }, { vendorId: contactId }] }, include: { allocations: true }, orderBy: { paymentDate: 'desc' } });
  response.json({ success: true, data: records });
}

export async function pay(request, response) {
  const contactId = requireContact(request, response);
  if (!contactId) return;
  const { amount, method, salesInvoiceId, vendorBillId } = request.body;
  const paymentAmount = numeric(amount);
  if (paymentAmount <= 0 || !['CASH', 'BANK'].includes(method) || (!salesInvoiceId && !vendorBillId) || (salesInvoiceId && vendorBillId)) return response.status(400).json({ success: false, message: 'Choose one outstanding invoice or bill, a valid amount, and a payment method.' });
  const result = await prisma.$transaction(async transaction => {
    const invoiceRecord = salesInvoiceId ? await transaction.salesInvoice.findFirst({ where: { id: salesInvoiceId, customerId: contactId }, include: { allocations: true } }) : null;
    const billRecord = vendorBillId ? await transaction.vendorBill.findFirst({ where: { id: vendorBillId, vendorId: contactId }, include: { allocations: true } }) : null;
    const target = invoiceRecord || billRecord;
    if (!target) throw Object.assign(new Error('Invoice or bill not found.'), { statusCode: 404 });
    const outstanding = numeric(target.total) - allocationTotal(target.allocations);
    if (paymentAmount > outstanding + 0.005) throw Object.assign(new Error('Payment exceeds the outstanding amount.'), { statusCode: 400 });
    const payment = await transaction.payment.create({ data: { paymentNumber: `PAY-${Date.now()}`, amount: paymentAmount, paymentDate: new Date(), method, status: 'CONFIRMED', customerId: invoiceRecord ? contactId : null, vendorId: billRecord ? contactId : null, allocations: { create: { amount: paymentAmount, salesInvoiceId: invoiceRecord ? invoiceRecord.id : null, vendorBillId: billRecord ? billRecord.id : null } } } });
    const nextStatus = paymentAmount >= outstanding - 0.005 ? 'PAID' : 'PARTIALLY_PAID';
    await (invoiceRecord ? transaction.salesInvoice.update({ where: { id: invoiceRecord.id }, data: { status: nextStatus } }) : transaction.vendorBill.update({ where: { id: billRecord.id }, data: { status: nextStatus } }));
    return payment;
  });
  response.status(201).json({ success: true, data: result, message: 'Payment recorded.' });
}
