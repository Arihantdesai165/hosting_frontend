import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.'),
  password: z.string({ required_error: 'Password is required.' })
    .min(6, 'Password must be at least 6 characters.'),
});

export const registerSchema = z.object({
  firstName: z.string({ required_error: 'First name is required.' })
    .min(1, 'First name is required.')
    .max(50, 'First name must not exceed 50 characters.'),
  lastName: z.string({ required_error: 'Last name is required.' })
    .min(1, 'Last name is required.')
    .max(50, 'Last name must not exceed 50 characters.'),
  email: z.string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .max(100, 'Email must not exceed 100 characters.'),
  password: z.string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must not exceed 100 characters.'),
  phone: z.string()
    .regex(/^\+?[0-9\s-]{8,15}$/, 'Please enter a valid phone number.')
    .optional()
    .nullable()
    .or(z.literal('')),
});
