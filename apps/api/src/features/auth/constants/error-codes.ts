// src/features/auth/constants/error-codes.ts
/**
 * Error codes specific to authentication feature.
 * Used for login, registration, token management, etc.
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH.INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'AUTH.TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH.TOKEN_INVALID',
  EMAIL_ALREADY_EXISTS: 'AUTH.EMAIL_ALREADY_EXISTS',
  REFRESH_TOKEN_INVALID: 'AUTH.REFRESH_TOKEN_INVALID',
  PASSWORD_RESET_RATE_LIMIT: 'AUTH.PASSWORD_RESET_RATE_LIMIT',
  INVALID_OTP: 'AUTH.INVALID_OTP',
  INVALID_RESET_TOKEN: 'AUTH.INVALID_RESET_TOKEN',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
