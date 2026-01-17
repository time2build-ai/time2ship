export { ERROR_CODES } from './error-codes';

/**
 * JWT token expiration times.
 * ACCESS: Short-lived token for API requests (15 minutes)
 * REFRESH: Long-lived token for obtaining new access tokens (7 days)
 */
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;

/**
 * Number of bcrypt hashing rounds for password encryption.
 * Higher values increase security but also CPU cost. 10 rounds provides
 * a good balance for most applications.
 */
export const BCRYPT_ROUNDS = 10;
