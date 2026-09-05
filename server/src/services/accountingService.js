const accountDefinitions = {
  'Accounts Receivable': { code: '1100', type: 'ASSET', aliases: ['Accounts Receivable', 'Debtors'] },
  'Accounts Payable': { code: '2000', type: 'LIABILITY', aliases: ['Accounts Payable', 'Creditors'] },
  Sales: { code: '4000', type: 'INCOME', aliases: ['Sales', 'Sales Income'] },
  Bank: { code: '1010', type: 'ASSET', aliases: ['Bank'] },
  Cash: { code: '1000', type: 'ASSET', aliases: ['Cash'] }
};

async function resolveAccount(transaction, name) {
  const definition = accountDefinitions[name] || { code: `AUTO-${name.replace(/\W/g, '').toUpperCase()}`, type: 'ASSET', aliases: [name] };
  const account = await transaction.account.findFirst({
    where: { isActive: true, OR: definition.aliases.map(alias => ({ name: { contains: alias, mode: 'insensitive' } })) }
  });
  if (account) return account;
  return transaction.account.upsert({
    where: { code: definition.code },
    update: { isActive: true },
    create: { code: definition.code, name, type: definition.type }
  });
}

async function resolveJournal(transaction, type) {
  const existing = await transaction.journal.findFirst({ where: { type } });
  if (existing) return existing;
  return transaction.journal.create({
    data: { code: `AUTO-${type}`, name: `${type[0]}${type.slice(1).toLowerCase()} Journal`, type }
  });
}

async function resolveAnalyticAccount(transaction, account) {
  if (!['INCOME', 'EXPENSE'].includes(account.type)) return null;
  return transaction.analyticAccount.findFirst({ where: { type: account.type } });
}

async function createBalancedEntry(transaction, { journalType, reference, description, partnerId, debit, credit, amount, createdById }) {
  const [journal, debitAccount, creditAccount] = await Promise.all([
    resolveJournal(transaction, journalType),
    resolveAccount(transaction, debit),
    resolveAccount(transaction, credit)
  ]);
  const [debitAnalyticAccount, creditAnalyticAccount] = await Promise.all([
    resolveAnalyticAccount(transaction, debitAccount),
    resolveAnalyticAccount(transaction, creditAccount)
  ]);
  return transaction.journalEntry.create({
    data: {
      journalId: journal.id,
      date: new Date(),
      reference,
      description,
      status: 'POSTED',
      createdById,
      items: {
        create: [
          { accountId: debitAccount.id, analyticAccountId: debitAnalyticAccount?.id || null, partnerId, debit: amount, credit: 0 },
          { accountId: creditAccount.id, analyticAccountId: creditAnalyticAccount?.id || null, partnerId, debit: 0, credit: amount }
        ]
      }
    }
  });
}

export function postSale(transaction, details) {
  return createBalancedEntry(transaction, {
    ...details,
    journalType: 'SALES',
    debit: 'Accounts Receivable',
    credit: 'Sales'
  });
}

export function postCustomerPayment(transaction, details) {
  return createBalancedEntry(transaction, {
    ...details,
    journalType: details.method,
    debit: details.method === 'BANK' ? 'Bank' : 'Cash',
    credit: 'Accounts Receivable'
  });
}

export async function postPurchase(_transaction, _client) {
  // Future implementation: debit Purchase Expense and Input Tax; credit Accounts Payable.
  return { status: 'not_implemented', transactionType: 'PURCHASE' };
}

export async function postVendorPayment(transaction, details) {
  return createBalancedEntry(transaction, {
    ...details,
    journalType: details.method,
    debit: 'Accounts Payable',
    credit: details.method === 'BANK' ? 'Bank' : 'Cash'
  });
}
