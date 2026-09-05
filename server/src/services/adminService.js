import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';

const publicUser = user => ({ id: user.id, loginId: user.loginId, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt });
const asNumber = value => Number(value || 0);

export async function getDashboard() {
  const [totalUsers, customers, vendors, totalProducts, sales, purchases, pendingInvoices, pendingBills] = await Promise.all([
    prisma.user.count(),
    prisma.contact.count({ where: { type: { in: ['CUSTOMER', 'BOTH'] }, isActive: true } }),
    prisma.contact.count({ where: { type: { in: ['VENDOR', 'BOTH'] }, isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.salesInvoice.aggregate({ _sum: { total: true } }),
    prisma.vendorBill.aggregate({ _sum: { total: true } }),
    prisma.salesInvoice.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'] } } }),
    prisma.vendorBill.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'] } } })
  ]);
  return { totalUsers, totalCustomers: customers, totalVendors: vendors, totalProducts, sales: asNumber(sales._sum.total), purchases: asNumber(purchases._sum.total), pendingInvoices, pendingBills };
}

export async function listUsers({ search, role, status }) {
  const where = {
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { loginId: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(role && role !== 'ALL' ? { role } : {}),
    ...(status && status !== 'ALL' ? { isActive: status === 'ACTIVE' } : {})
  };
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  return users.map(publicUser);
}

export async function createUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { name: input.name.trim(), loginId: input.loginId.trim(), email: input.email.trim().toLowerCase(), role: input.role, passwordHash, isActive: true } });
  return publicUser(user);
}

export async function updateUser(id, input) {
  const data = { ...input };
  delete data.password;
  if (input.password) data.passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.update({ where: { id }, data });
  return publicUser(user);
}

export async function deleteUser(id) {
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}
