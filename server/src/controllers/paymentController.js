import { prisma } from '../config/db.js';
import { postCustomerPayment } from '../services/accountingService.js';

const n = value => Number(value || 0);
const paid = allocations => allocations.reduce((sum, allocation) => sum + n(allocation.amount), 0);
const numberFor = () => `PAY-${new Date().getFullYear()}-${Date.now()}`;

export async function listPaymentTargets(_request, response) {
  const [invoices, bills, payments] = await Promise.all([
    prisma.salesInvoice.findMany({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] } }, include: { customer: true, paymentAllocations: true }, orderBy: { invoiceDate: 'desc' } }),
    prisma.vendorBill.findMany({ where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] } }, include: { vendor: true, paymentAllocations: true }, orderBy: { invoiceDate: 'desc' } }),
    prisma.payment.findMany({ include: { customer: true, vendor: true, allocations: true }, orderBy: { paymentDate: 'desc' }, take: 50 })
  ]);
  response.json({ success: true, data: {
    invoices: invoices.map(invoice => ({ ...invoice, paid: paid(invoice.paymentAllocations), outstanding: Math.max(0, n(invoice.total) - paid(invoice.paymentAllocations)) })),
    bills: bills.map(bill => ({ ...bill, paid: paid(bill.paymentAllocations), outstanding: Math.max(0, n(bill.total) - paid(bill.paymentAllocations)) })),
    payments
  } });
}

export async function registerPayment(request, response) {
  const { documentType, documentId, amount, method, paymentDate, reference, notes } = request.body;
  const paymentAmount = n(amount);
  if (!['INVOICE', 'BILL'].includes(documentType) || !documentId) return response.status(400).json({ success: false, message: 'Select a sales invoice or vendor bill.' });
  if (paymentAmount <= 0 || !['CASH', 'BANK'].includes(method)) return response.status(400).json({ success: false, message: 'Enter a valid amount and choose Bank or Cash.' });
  const result = await prisma.$transaction(async transaction => {
    const invoice = documentType === 'INVOICE' ? await transaction.salesInvoice.findUnique({ where: { id: documentId }, include: { paymentAllocations: true, customer: true } }) : null;
    const bill = documentType === 'BILL' ? await transaction.vendorBill.findUnique({ where: { id: documentId }, include: { paymentAllocations: true, vendor: true } }) : null;
    const document = invoice || bill;
    if (!document) throw Object.assign(new Error('Selected invoice or bill was not found.'), { statusCode: 404 });
    const existingPaid = paid(document.paymentAllocations);
    const outstanding = n(document.total) - existingPaid;
    if (paymentAmount > outstanding + 0.005) throw Object.assign(new Error('Payment exceeds the outstanding amount.'), { statusCode: 400 });
    const payment = await transaction.payment.create({ data: { paymentNumber: numberFor(), amount: paymentAmount, paymentDate: paymentDate ? new Date(paymentDate) : new Date(), method, status: 'CONFIRMED', reference: reference?.trim() || null, notes: notes?.trim() || null, customerId: invoice ? invoice.customerId : null, vendorId: bill ? bill.vendorId : null, createdById: request.user.id, allocations: { create: { amount: paymentAmount, salesInvoiceId: invoice?.id || null, vendorBillId: bill?.id || null } } } });
    const nextStatus = paymentAmount >= outstanding - 0.005 ? 'PAID' : 'PARTIALLY_PAID';
    if (invoice) {
      await transaction.salesInvoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
      await postCustomerPayment(transaction, { reference: payment.paymentNumber, description: `Payment for ${invoice.invoiceNumber}`, partnerId: invoice.customerId, amount: paymentAmount, method, createdById: request.user.id });
    } else {
      await transaction.vendorBill.update({ where: { id: bill.id }, data: { status: nextStatus } });
    }
    return payment;
  });
  response.status(201).json({ success: true, data: result, message: 'Payment recorded successfully.' });
}
