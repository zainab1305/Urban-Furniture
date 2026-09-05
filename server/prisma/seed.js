import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { loginId: 'admin123' },
    update: {
      passwordHash: adminPasswordHash,
      isActive: true
    },
    create: {
      loginId: 'admin123',
      name: 'Nisha Shah',
      email: 'admin@urbanfurniture.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  console.log(`Database seeded successfully. Admin user ready: ${admin.loginId} (${admin.email})`);

  const accounts = [
    ['1000', 'Cash', 'ASSET'],
    ['1010', 'Bank', 'ASSET'],
    ['1100', 'Debtors', 'ASSET'],
    ['2000', 'Creditors', 'LIABILITY'],
    ['4000', 'Sales Income', 'INCOME'],
    ['5000', 'Purchase Expense', 'EXPENSE'],
    ['5100', 'Other Expense', 'EXPENSE'],
    ['3000', 'Capital', 'CAPITAL']
  ];

  for (const [code, name, type] of accounts) {
    await prisma.account.upsert({ where: { code }, update: { name, type, isActive: true }, create: { code, name, type } });
  }
  console.log(`Default chart of accounts ready: ${accounts.length} accounts`);
}

main()
  .catch(error => {
    console.error('Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
