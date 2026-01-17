// src/features/auth/errors/auth.errors.ts
import { AppError } from '@/common/utils/errors';
import { AUTH_ERROR_CODES } from '../constants/error-codes';

/**
 * Error thrown when login credentials are invalid.
 * Used for both incorrect email and incorrect password to avoid user enumeration.
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(
      'Invalid email or password',
      401,
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
  }
}

/**
 * Error thrown when a JWT token has expired.
 */
export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, AUTH_ERROR_CODES.TOKEN_EXPIRED);
  }
}

/**
 * Error thrown when a JWT token is malformed or invalid.
 */
export class TokenInvalidError extends AppError {
  constructor() {
    super('Invalid token', 401, AUTH_ERROR_CODES.TOKEN_INVALID);
  }
}

/**
 * Error thrown when a refresh token is invalid or revoked.
 */
export class RefreshTokenInvalidError extends AppError {
  constructor() {
    super(
      'Invalid or revoked refresh token',
      401,
      AUTH_ERROR_CODES.REFRESH_TOKEN_INVALID
    );
  }
}
