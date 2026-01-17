import { cookies } from 'next/headers';
import { decodeToken } from './tokens';

export interface User {
  id: string;
  email: string;
}

/**
 * Get current user from access token cookie
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return null;
  }

  const decoded = decodeToken(accessToken);

  if (!decoded.userId || !decoded.email) {
    return null;
  }

  return {
    id: decoded.userId,
    email: decoded.email,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Cookie options for auth tokens
 */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
