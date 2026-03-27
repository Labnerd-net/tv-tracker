import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128, 'Password must be at most 128 characters long'),
});

export const registrationSchema = loginSchema.extend({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128, 'Password must be at most 128 characters long'),
});

export const jwtDataSchema = z.object({
  sub: z.number(),
  email: z.string(),
  displayName: z.string(),
  roles: z.array(z.enum(['user', 'admin'])),
  exp: z.number(),
});
