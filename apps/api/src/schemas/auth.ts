import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required').max(254),
  password: z.string().min(1, 'Password is required'),
});

export const registrationSchema = loginSchema.extend({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .trim(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
