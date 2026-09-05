import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  const adminPasswordHash = await bcrypt.hash('Urban@1234', 12);

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
}

main()
  .catch(error => {
    console.error('Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
