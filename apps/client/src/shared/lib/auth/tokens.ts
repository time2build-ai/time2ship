import { jwtVerify, decodeJwt } from 'jose';

/**
 * Decode JWT token without verification (for reading expiry time)
 */
export function decodeToken(token: string): {
  exp?: number;
  userId?: string;
  email?: string;
} {
  try {
    return decodeJwt(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return {};
  }
}

/**
 * Get token expiration timestamp (milliseconds)
 */
export function getTokenExpiry(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded.exp) {
    return 0;
  }
  return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  const expiry = getTokenExpiry(token);
  return expiry < Date.now() + bufferMs;
}
