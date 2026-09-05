import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const accountData = [
  ['Cash', 'ASSET'], ['Bank', 'ASSET'], ['Accounts Receivable', 'ASSET'], ['Inventory', 'ASSET'],
  ['Accounts Payable', 'LIABILITY'], ['Tax Payable', 'LIABILITY'], ['Sales Income', 'INCOME'],
  ['Purchase Expense', 'EXPENSE'], ['Other Expenses', 'EXPENSE'], ['Owner Capital', 'CAPITAL']
];

async function main() {
  const password = await bcrypt.hash('password', 10);
  await prisma.user.createMany({ data: [
    { name: 'Urban Admin', email: 'admin@urbanfurniture.local', password, role: 'ADMIN' },
    { name: 'Urban Accountant', email: 'accountant@urbanfurniture.local', password, role: 'ACCOUNTANT' },
    { name: 'Demo Contact', email: 'contact@urbanfurniture.local', password, role: 'CONTACT' }
  ], skipDuplicates: true });
  await prisma.contact.createMany({ data: [
    { name: 'Azure Furniture', type: 'VENDOR', email: 'sales@azurefurniture.local', city: 'Bengaluru', state: 'Karnataka' },
    { name: 'Nimesh Pathak', type: 'CUSTOMER', email: 'nimesh@example.com', city: 'Mumbai', state: 'Maharashtra' }
  ], skipDuplicates: true });
  await prisma.product.createMany({ data: [
    { name: 'Office Chair', type: 'GOODS', category: 'Seating', salesPrice: 8500, purchasePrice: 5200, stockQuantity: 42, taxRate: 18 },
    { name: 'Wooden Table', type: 'GOODS', category: 'Tables', salesPrice: 24000, purchasePrice: 15000, stockQuantity: 18, taxRate: 18 },
    { name: 'Sofa', type: 'GOODS', category: 'Living Room', salesPrice: 42000, purchasePrice: 27000, stockQuantity: 9, taxRate: 12 },
    { name: 'Dining Table', type: 'GOODS', category: 'Tables', salesPrice: 36000, purchasePrice: 22000, stockQuantity: 12, taxRate: 18 }
  ], skipDuplicates: true });
  const accounts = {};
  for (const [name, type] of accountData) accounts[name] = await prisma.account.upsert({ where: { id: `${type}-${name}` }, update: {}, create: { id: `${type}-${name}`, name, type } });
  await prisma.journal.createMany({ data: [
    { name: 'Sales Journal', type: 'SALES', defaultDebitAccountId: accounts['Accounts Receivable'].id, defaultCreditAccountId: accounts['Sales Income'].id },
    { name: 'Purchase Journal', type: 'PURCHASE', defaultDebitAccountId: accounts['Purchase Expense'].id, defaultCreditAccountId: accounts['Accounts Payable'].id },
    { name: 'Cash Journal', type: 'CASH', defaultDebitAccountId: accounts.Cash.id, defaultCreditAccountId: accounts['Accounts Receivable'].id },
    { name: 'Bank Journal', type: 'BANK', defaultDebitAccountId: accounts.Bank.id, defaultCreditAccountId: accounts['Accounts Receivable'].id },
    { name: 'General Journal', type: 'GENERAL' }
  ], skipDuplicates: true });
  console.log('Seed data created. Demo password: password');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
