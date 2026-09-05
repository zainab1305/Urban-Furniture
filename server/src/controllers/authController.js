import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { loginSchema, registerSchema } from '../validators/auth.js';

const tokenFor = user => jwt.sign({ id: user.id, role: user.role, email: user.email }, env.jwtSecret, { expiresIn: '1d' });
const publicUser = ({ password: _password, ...user }) => user;

export async function register(request, response) {
  const input = registerSchema.parse(request.body);
  const password = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({ data: { ...input, password } });
  response.status(201).json({ success: true, data: { user: publicUser(user), token: tokenFor(user) } });
}

export async function login(request, response) {
  const input = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.password))) return response.status(401).json({ success: false, message: 'Invalid credentials' });
  response.json({ success: true, data: { user: publicUser(user), token: tokenFor(user) } });
}

export async function me(request, response) {
  const user = await prisma.user.findUnique({ where: { id: request.user.id } });
  response.json({ success: true, data: user ? publicUser(user) : null });
}
