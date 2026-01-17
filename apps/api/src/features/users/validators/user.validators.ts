import { z } from 'zod';
import { paginationSchema } from '@/common/validators/pagination';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    password: passwordSchema.optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

/**
 * Validation schema for listing users with pagination.
 */
export const listUsersSchema = paginationSchema;

export type ListUsersInput = z.infer<typeof listUsersSchema>;
