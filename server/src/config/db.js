import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const defaultAccounts = [
	['1000', 'Cash', 'ASSET'],
	['1010', 'Bank', 'ASSET'],
	['1100', 'Debtors', 'ASSET'],
	['2000', 'Creditors', 'LIABILITY'],
	['3000', 'Capital', 'CAPITAL'],
	['4000', 'Sales Income', 'INCOME'],
	['5000', 'Purchase Expense', 'EXPENSE'],
	['5100', 'Other Expense', 'EXPENSE']
];

export async function ensureDefaultAccounts() {
	for (const [code, name, type] of defaultAccounts) {
		await prisma.account.upsert({
			where: { code },
			update: { name, type, isActive: true },
			create: { code, name, type }
		});
	}
}
