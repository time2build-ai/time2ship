import { z } from 'zod';

/**
 * Validation schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

/**
 * Validation schema for OTP verification request
 */
export const verifyResetOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

/**
 * Validation schema for password reset request
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
