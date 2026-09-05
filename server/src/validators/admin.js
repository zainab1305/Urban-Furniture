import { z } from 'zod';
import { loginIdRegex, passwordRegex } from './auth.js';

export const adminUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  loginId: z.string().trim().regex(loginIdRegex, 'Login ID must be 6-12 letters, numbers, or underscores.'),
  email: z.string().trim().email('Enter a valid email address.'),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'CONTACT']),
  contactId: z.string().cuid().optional(),
  password: z.string().regex(passwordRegex, 'Password must be more than 8 characters with lowercase, uppercase, and special character.'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'CONTACT']).optional(),
  password: z.string().regex(passwordRegex).optional(),
  isActive: z.boolean().optional()
});
