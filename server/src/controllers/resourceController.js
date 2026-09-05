import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

const parseNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export async function listContacts(request, response) {
  const { search, type, status } = request.query;
  const contacts = await prisma.contact.findMany({ where: { ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { mobile: { contains: search, mode: 'insensitive' } }] } : {}), ...(type && type !== 'ALL' ? { type } : {}), ...(status && status !== 'ALL' ? { isActive: status === 'ACTIVE' } : {}) }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: contacts });
}

export async function createContact(request, response) {
  const { name, type, email, mobile, address, city, state, pincode, createPortalUser, loginId, password, confirmPassword } = request.body || {};
  const shouldCreatePortalUser = createPortalUser === true || createPortalUser === 'true';
  if (!name?.trim() || !['CUSTOMER', 'VENDOR', 'BOTH'].includes(type)) return response.status(400).json({ success: false, message: 'Name and contact type are required.' });
  if (shouldCreatePortalUser && (!email?.trim() || !loginId || !password || password !== confirmPassword)) return response.status(400).json({ success: false, message: 'Email, portal Login ID and matching password are required.' });
  const contact = await prisma.$transaction(async transaction => {
    const created = await transaction.contact.create({ data: { name: name.trim(), type, email: email?.trim() || null, mobile: mobile?.trim() || null, address: address?.trim() || null, city: city?.trim() || null, state: state?.trim() || null, pincode: pincode?.trim() || null, profileImage: request.file ? `/uploads/contacts/${request.file.filename}` : null } });
    if (shouldCreatePortalUser) {
      const passwordHash = await bcrypt.hash(password, 12);
      await transaction.user.create({ data: { loginId: loginId.trim(), name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role: 'CONTACT', contactId: created.id } });
    }
    return created;
  });
  response.status(201).json({ success: true, data: contact });
}

export async function updateContact(request, response) {
  const { name, type, email, mobile, address, city, state, pincode, isActive } = request.body || {};
  const contact = await prisma.contact.update({ where: { id: request.params.id }, data: { ...(name !== undefined ? { name: name.trim() } : {}), ...(type ? { type } : {}), ...(email !== undefined ? { email: email?.trim() || null } : {}), ...(mobile !== undefined ? { mobile: mobile?.trim() || null } : {}), ...(address !== undefined ? { address: address?.trim() || null } : {}), ...(city !== undefined ? { city: city?.trim() || null } : {}), ...(state !== undefined ? { state: state?.trim() || null } : {}), ...(pincode !== undefined ? { pincode: pincode?.trim() || null } : {}), ...(request.file ? { profileImage: `/uploads/contacts/${request.file.filename}` } : {}), ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}) } });
  response.json({ success: true, data: contact });
}

export async function archiveContact(request, response) {
  await prisma.contact.update({ where: { id: request.params.id }, data: { isActive: false } });
  response.json({ success: true, message: 'Contact archived.' });
}

export async function listAccounts(request, response) {
  const { search, type, status } = request.query;
  const accounts = await prisma.account.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(type && type !== 'ALL' ? { type } : {}),
      ...(status && status !== 'ALL' ? { isActive: status === 'ACTIVE' } : {})
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  });
  response.json({ success: true, data: accounts });
}

export async function createAccount(request, response) {
  const { name, type } = request.body;
  if (!name?.trim() || !['ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'CAPITAL'].includes(type)) {
    return response.status(400).json({ success: false, message: 'Account name and type are required.' });
  }
  const account = await prisma.account.create({ data: { code: `CUSTOM-${Date.now()}`, name: name.trim(), type } });
  response.status(201).json({ success: true, data: account });
}

export async function updateAccount(request, response) {
  const { name, type, isActive } = request.body;
  const account = await prisma.account.update({
    where: { id: request.params.id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(type ? { type } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
    }
  });
  response.json({ success: true, data: account });
}

export async function archiveAccount(request, response) {
  await prisma.account.update({ where: { id: request.params.id }, data: { isActive: false } });
  response.json({ success: true, message: 'Account archived.' });
}

export async function listProducts(request, response) {
  const { search, type, status } = request.query;
  const products = await prisma.product.findMany({ include: { category: true }, where: { ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] } : {}), ...(type && type !== 'ALL' ? { type } : {}), ...(status && status !== 'ALL' ? { isActive: status === 'ACTIVE' } : {}) }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, data: products });
}

export async function createProduct(request, response) {
  const { sku, name, type, category, salesPrice, purchasePrice, stockQuantity, taxRate } = request.body || {};
  if (!sku?.trim() || !name?.trim() || !['GOODS', 'SERVICE', 'COMBO'].includes(type)) return response.status(400).json({ success: false, message: 'SKU, name and product type are required.' });
  const product = await prisma.product.create({ data: { sku: sku.trim(), name: name.trim(), type, salesPrice: parseNumber(salesPrice), purchasePrice: parseNumber(purchasePrice), stockQuantity: parseNumber(stockQuantity), taxRate: parseNumber(taxRate), imageUrl: request.file ? `/uploads/products/${request.file.filename}` : null, category: category?.trim() ? { connectOrCreate: { where: { name: category.trim() }, create: { name: category.trim() } } } : undefined } });
  response.status(201).json({ success: true, data: product });
}

export async function updateProduct(request, response) {
  const { sku, name, type, category, salesPrice, purchasePrice, stockQuantity, taxRate, isActive } = request.body || {};
  const product = await prisma.product.update({ where: { id: request.params.id }, data: { ...(sku !== undefined ? { sku: sku.trim() } : {}), ...(name !== undefined ? { name: name.trim() } : {}), ...(type ? { type } : {}), ...(salesPrice !== undefined ? { salesPrice: parseNumber(salesPrice) } : {}), ...(purchasePrice !== undefined ? { purchasePrice: parseNumber(purchasePrice) } : {}), ...(stockQuantity !== undefined ? { stockQuantity: parseNumber(stockQuantity) } : {}), ...(taxRate !== undefined ? { taxRate: parseNumber(taxRate) } : {}), ...(request.file ? { imageUrl: `/uploads/products/${request.file.filename}` } : {}), ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}), ...(category !== undefined ? { category: category?.trim() ? { connectOrCreate: { where: { name: category.trim() }, create: { name: category.trim() } } } : { disconnect: true } } : {}) } });
  response.json({ success: true, data: product });
}

export async function archiveProduct(request, response) {
  await prisma.product.update({ where: { id: request.params.id }, data: { isActive: false } });
  response.json({ success: true, message: 'Product archived.' });
}
