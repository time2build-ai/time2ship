import { AppError } from '@/common/utils/errors';
import { AUTH_ERROR_CODES } from '../constants/error-codes';

/**
 * Error thrown when rate limit is exceeded for password reset requests
 */
export class PasswordResetRateLimitError extends AppError {
  constructor() {
    super(
      'Too many password reset requests. Please try again later.',
      429,
      AUTH_ERROR_CODES.PASSWORD_RESET_RATE_LIMIT
    );
    this.name = 'PasswordResetRateLimitError';
  }
}

/**
 * Error thrown when OTP is invalid or expired
 */
export class InvalidOtpError extends AppError {
  constructor() {
    super('Invalid or expired code', 400, AUTH_ERROR_CODES.INVALID_OTP);
    this.name = 'InvalidOtpError';
  }
}

/**
 * Error thrown when reset token is invalid or expired
 */
export class InvalidResetTokenError extends AppError {
  constructor() {
    super(
      'Reset session expired, please start over',
      401,
      AUTH_ERROR_CODES.INVALID_RESET_TOKEN
    );
    this.name = 'InvalidResetTokenError';
  }
}
