import { prisma } from '../config/db.js';

const numberValue = value => Number(value || 0);
const publicEntry = entry => ({
  ...entry,
  total: entry.items.reduce((sum, item) => sum + numberValue(item.debit), 0),
  items: entry.items.map(item => ({ ...item, debit: numberValue(item.debit), credit: numberValue(item.credit) }))
});

function validateItems(items, requireBalanced = true) {
  if (!Array.isArray(items) || items.length === 0) return 'At least one journal item is required.';
  let debit = 0;
  let credit = 0;
  for (const item of items) {
    const itemDebit = numberValue(item.debit);
    const itemCredit = numberValue(item.credit);
    if (!item.accountId) return 'Every journal item must have an account.';
    if (itemDebit < 0 || itemCredit < 0) return 'Debit and credit amounts cannot be negative.';
    if (itemDebit > 0 && itemCredit > 0) return 'A journal item cannot have both debit and credit.';
    if (itemDebit === 0 && itemCredit === 0) return 'Every journal item must contain a debit or credit amount.';
    debit += itemDebit;
    credit += itemCredit;
  }
  if (requireBalanced && Math.abs(debit - credit) > 0.005) return 'Debit and credit amounts must be equal.';
  return null;
}

export async function listJournals(_request, response) {
  const journals = await prisma.journal.findMany({
    include: { defaultDebitAccount: true, defaultCreditAccount: true },
    orderBy: { name: 'asc' }
  });
  response.json({ success: true, data: journals });
}

export async function createJournal(request, response) {
  const { name, type, defaultAccountId } = request.body;
  if (!name?.trim() || !['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL'].includes(type) || !defaultAccountId) {
    return response.status(400).json({ success: false, message: 'Journal name, type and default account are required.' });
  }
  try {
    const account = await prisma.account.findFirst({ where: { id: defaultAccountId, isActive: true } });
    if (!account) return response.status(400).json({ success: false, message: 'Select an active account.' });
    const journal = await prisma.journal.create({ data: { code: `J-${Date.now()}`, name: name.trim(), type, defaultDebitAccountId: account.id }, include: { defaultDebitAccount: true } });
    response.status(201).json({ success: true, data: journal });
  } catch (error) {
    if (error.code === 'P2002') return response.status(409).json({ success: false, message: 'A journal with this name or code already exists.' });
    throw error;
  }
}

export async function updateJournal(request, response) {
  const { name, type, defaultAccountId } = request.body;
  const data = { ...(name ? { name: name.trim() } : {}), ...(type ? { type } : {}), ...(defaultAccountId ? { defaultDebitAccountId: defaultAccountId } : {}) };
  const journal = await prisma.journal.update({ where: { id: request.params.id }, data, include: { defaultDebitAccount: true } });
  response.json({ success: true, data: journal });
}

export async function archiveJournal(request, response) {
  const used = await prisma.journalEntry.count({ where: { journalId: request.params.id } });
  if (used) return response.status(409).json({ success: false, message: 'Journals used by entries cannot be deleted.' });
  await prisma.journal.delete({ where: { id: request.params.id } });
  response.json({ success: true, message: 'Journal deleted.' });
}

export async function listJournalEntries(request, response) {
  const { search, status } = request.query;
  const entries = await prisma.journalEntry.findMany({
    where: { ...(status && status !== 'ALL' ? { status } : {}), ...(search ? { OR: [{ reference: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}) },
    include: { journal: true, items: { include: { account: true, partner: true } } },
    orderBy: { date: 'desc' }
  });
  response.json({ success: true, data: entries.map(publicEntry) });
}

export async function getJournalEntry(request, response) {
  const entry = await prisma.journalEntry.findUnique({ where: { id: request.params.id }, include: { journal: true, items: { include: { account: true, partner: true } } } });
  if (!entry) return response.status(404).json({ success: false, message: 'Journal entry not found.' });
  response.json({ success: true, data: publicEntry(entry) });
}

export async function createJournalEntry(request, response) {
  const { date, journalId, reference, description, items, status = 'DRAFT' } = request.body;
  if (!date || !journalId) return response.status(400).json({ success: false, message: 'Accounting date and journal are required.' });
  if (!['DRAFT', 'POSTED'].includes(status)) return response.status(400).json({ success: false, message: 'Invalid journal entry status.' });
  const itemError = validateItems(items, status === 'POSTED');
  if (itemError) return response.status(400).json({ success: false, message: itemError });
  const entry = await prisma.$transaction(async transaction => {
    const journal = await transaction.journal.findUnique({ where: { id: journalId } });
    if (!journal) throw Object.assign(new Error('Journal not found.'), { statusCode: 400 });
    const accountIds = [...new Set(items.map(item => item.accountId))];
    const activeAccounts = await transaction.account.count({ where: { id: { in: accountIds }, isActive: true } });
    if (activeAccounts !== accountIds.length) throw Object.assign(new Error('Every journal item must use an active account.'), { statusCode: 400 });
    return transaction.journalEntry.create({ data: { date: new Date(date), journalId, reference: reference?.trim() || null, description: description?.trim() || null, status, createdById: request.user.id, items: { create: items.map(item => ({ accountId: item.accountId, debit: numberValue(item.debit), credit: numberValue(item.credit) })) } }, include: { journal: true, items: { include: { account: true } } } });
  });
  response.status(201).json({ success: true, data: publicEntry(entry) });
}

export async function postJournalEntry(request, response) {
  const entry = await prisma.journalEntry.findUnique({ where: { id: request.params.id }, include: { items: true } });
  if (!entry) return response.status(404).json({ success: false, message: 'Journal entry not found.' });
  if (entry.status === 'POSTED') return response.status(409).json({ success: false, message: 'Journal entry is already posted.' });
  const error = validateItems(entry.items);
  if (error) return response.status(400).json({ success: false, message: error });
  const posted = await prisma.$transaction(transaction => transaction.journalEntry.update({ where: { id: entry.id }, data: { status: 'POSTED' }, include: { journal: true, items: { include: { account: true } } } }));
  response.json({ success: true, data: publicEntry(posted) });
}
