// src/common/validators/pagination.ts
import { z } from 'zod';

/**
 * Reusable Zod schema for pagination query parameters.
 * Validates and transforms page and limit as numbers.
 *
 * @example
 * import { paginationSchema } from '@/common/validators/pagination';
 *
 * export const listUsersSchema = paginationSchema.extend({
 *   query: paginationSchema.shape.query.extend({
 *     role: z.enum(['admin', 'user']).optional(),
 *   }),
 * });
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine((val) => val > 0, 'Page must be greater than 0')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine((val) => val > 0, 'Limit must be greater than 0')
      .optional(),
  }),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
