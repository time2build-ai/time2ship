import { z } from 'zod';

/**
 * Password validation schema requiring strength criteria:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Validation schema for user registration.
 * Requires email and strong password.
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
  }),
});

/**
 * Validation schema for user login.
 * Requires email and password (no strength check on login).
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Validation schema for token refresh requests.
 * Requires a refresh token string.
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
