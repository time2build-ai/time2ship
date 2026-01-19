import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const emailSchema = z.string().email('Invalid email address').max(255);

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(100);
