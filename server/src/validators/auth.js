import { z } from 'zod';

export const loginIdRegex = /^[a-zA-Z0-9_]{6,12}$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

export const signupSchema = z.object({
  loginId: z
    .string({ required_error: 'Please enter your Login ID.' })
    .trim()
    .min(1, 'Please enter your Login ID.')
    .min(6, 'Login ID must be at least 6 characters.')
    .max(12, 'Login ID must be at most 12 characters.')
    .regex(loginIdRegex, 'Login ID can only contain letters, numbers, and underscores without spaces.'),
  email: z
    .string({ required_error: 'Please enter a valid email address.' })
    .trim()
    .min(1, 'Please enter a valid email address.')
    .email('Please enter a valid email address.'),
  password: z
    .string({ required_error: 'Please enter your password.' })
    .min(1, 'Please enter your password.')
    .regex(
      passwordRegex,
      'Password must be more than 8 characters, and contain at least one lowercase letter, one uppercase letter, and one special character.'
    ),
  confirmPassword: z
    .string({ required_error: 'Please confirm your password.' })
    .min(1, 'Please confirm your password.'),
  name: z.string().trim().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  loginId: z
    .string({ required_error: 'Please enter your Login ID.' })
    .trim()
    .min(1, 'Please enter your Login ID.'),
  password: z
    .string({ required_error: 'Please enter your password.' })
    .min(1, 'Please enter your password.')
});
