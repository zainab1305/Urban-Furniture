import { prisma } from '../config/db.js';

const analyticTypes = ['INCOME', 'EXPENSE'];
const budgetStatuses = ['DRAFT', 'CONFIRMED', 'REVISED', 'CANCELLED'];
const numberValue = value => Number(value || 0);

const publicBudget = budget => ({
  ...budget,
  amount: numberValue(budget.amount),
  achievedAmount: numberValue(budget.achievedAmount),
  amountToAchieve: Math.max(0, numberValue(budget.amount) - numberValue(budget.achievedAmount)),
  achievedPercent: numberValue(budget.amount) ? (numberValue(budget.achievedAmount) / numberValue(budget.amount)) * 100 : 0
});

async function achievedForBudget(budget) {
  const items = await prisma.journalItem.findMany({
    where: {
      analyticAccountId: budget.analyticAccountId,
      journalEntry: { date: { gte: budget.periodStart, lte: budget.periodEnd }, status: 'POSTED' }
    },
    select: { debit: true, credit: true }
  });
  const achievedAmount = items.reduce((total, item) => total + (budget.analyticAccount.type === 'INCOME' ? numberValue(item.credit) : numberValue(item.debit)), 0);
  return { ...budget, achievedAmount };
}

export async function listAnalyticAccounts(request, response) {
  const { search, type } = request.query;
  const accounts = await prisma.analyticAccount.findMany({
    where: { ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}), ...(type && type !== 'ALL' ? { type } : {}) },
    include: { _count: { select: { budgets: true } } },
    orderBy: { name: 'asc' }
  });
  response.json({ success: true, data: accounts });
}

export async function createAnalyticAccount(request, response) {
  const { name, type } = request.body || {};
  if (!name?.trim() || !analyticTypes.includes(type)) return response.status(400).json({ success: false, message: 'Analytic account name and type are required.' });
  try {
    const account = await prisma.analyticAccount.create({ data: { name: name.trim(), type } });
    response.status(201).json({ success: true, data: account });
  } catch (error) {
    if (error.code === 'P2002') return response.status(409).json({ success: false, message: 'An analytic account with this name already exists.' });
    throw error;
  }
}

export async function updateAnalyticAccount(request, response) {
  const { name, type } = request.body || {};
  if ((name !== undefined && !name.trim()) || (type !== undefined && !analyticTypes.includes(type))) return response.status(400).json({ success: false, message: 'Analytic account name and type are invalid.' });
  const account = await prisma.analyticAccount.update({ where: { id: request.params.id }, data: { ...(name !== undefined ? { name: name.trim() } : {}), ...(type ? { type } : {}) } });
  response.json({ success: true, data: account });
}

export async function deleteAnalyticAccount(request, response) {
  const used = await prisma.budget.count({ where: { analyticAccountId: request.params.id } });
  if (used) return response.status(409).json({ success: false, message: 'Analytic accounts used by budgets cannot be deleted.' });
  await prisma.analyticAccount.delete({ where: { id: request.params.id } });
  response.json({ success: true, message: 'Analytic account deleted.' });
}

export async function listBudgets(request, response) {
  const { search, status, analyticAccountId } = request.query;
  const budgets = await prisma.budget.findMany({
    where: { ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}), ...(status && status !== 'ALL' ? { status } : {}), ...(analyticAccountId ? { analyticAccountId } : {}) },
    include: { analyticAccount: true },
    orderBy: { periodStart: 'desc' }
  });
  const enrichedBudgets = await Promise.all(budgets.map(achievedForBudget));
  response.json({ success: true, data: enrichedBudgets.map(publicBudget) });
}

export async function createBudget(request, response) {
  const { name, periodStart, periodEnd, amount, responsiblePerson, revisedWith, analyticAccountId } = request.body || {};
  const numericAmount = Number(amount);
  if (!name?.trim() || !periodStart || !periodEnd || !analyticAccountId || !Number.isFinite(numericAmount) || numericAmount < 0) return response.status(400).json({ success: false, message: 'Budget name, period, amount and analytic account are required.' });
  if (new Date(periodEnd) < new Date(periodStart)) return response.status(400).json({ success: false, message: 'Budget end date must be after the start date.' });
  const account = await prisma.analyticAccount.findUnique({ where: { id: analyticAccountId } });
  if (!account) return response.status(400).json({ success: false, message: 'Select a valid analytic account.' });
  const budget = await prisma.budget.create({ data: { name: name.trim(), periodStart: new Date(periodStart), periodEnd: new Date(periodEnd), amount: numericAmount, responsiblePerson: responsiblePerson?.trim() || null, revisedWith: revisedWith?.trim() || null, analyticAccountId }, include: { analyticAccount: true } });
  response.status(201).json({ success: true, data: publicBudget({ ...budget, achievedAmount: 0 }) });
}

export async function updateBudget(request, response) {
  const { name, periodStart, periodEnd, amount, responsiblePerson, revisedWith, analyticAccountId, status } = request.body || {};
  if (status && !budgetStatuses.includes(status)) return response.status(400).json({ success: false, message: 'Invalid budget status.' });
  const data = { ...(name !== undefined ? { name: name.trim() } : {}), ...(periodStart ? { periodStart: new Date(periodStart) } : {}), ...(periodEnd ? { periodEnd: new Date(periodEnd) } : {}), ...(amount !== undefined ? { amount: Number(amount) } : {}), ...(responsiblePerson !== undefined ? { responsiblePerson: responsiblePerson?.trim() || null } : {}), ...(revisedWith !== undefined ? { revisedWith: revisedWith?.trim() || null } : {}), ...(analyticAccountId ? { analyticAccountId } : {}), ...(status ? { status } : {}) };
  const budget = await prisma.budget.update({ where: { id: request.params.id }, data, include: { analyticAccount: true } });
  response.json({ success: true, data: publicBudget(await achievedForBudget(budget)) });
}

export async function updateBudgetStatus(request, response) {
  const { status } = request.body || {};
  if (!budgetStatuses.includes(status)) return response.status(400).json({ success: false, message: 'Invalid budget status.' });
  const budget = await prisma.budget.update({ where: { id: request.params.id }, data: { status }, include: { analyticAccount: true } });
  response.json({ success: true, data: publicBudget(await achievedForBudget(budget)) });
}