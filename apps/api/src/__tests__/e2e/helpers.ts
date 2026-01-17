import bcrypt from 'bcrypt';
import { testDb } from './setup';
import { users } from '@/features/users/schemas/user.schema';
import { refreshTokens } from '@/features/auth/schemas/refresh-token.schema';
import { tokenService } from '@/features/auth/services/token.service';
import { BCRYPT_ROUNDS } from '@/common/constants';

/**
 * Creates a test user in the database.
 *
 * @param email - User's email address (default: test@example.com)
 * @param password - Plain text password (default: Password123!)
 * @returns Created user object without password
 */
export async function createTestUser(
  email: string = 'test@example.com',
  password: string = 'Password123!'
) {
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [user] = await testDb
    .insert(users)
    .values({
      email,
      password: hashedPassword,
    })
    .returning();

  const { password: _, ...userWithoutPassword } = user;
  return { ...userWithoutPassword, plainPassword: password };
}

/**
 * Creates multiple test users in the database.
 *
 * @param count - Number of users to create
 * @returns Array of created users without passwords
 */
export async function createTestUsers(count: number) {
  const createdUsers = [];

  for (let i = 0; i < count; i++) {
    const user = await createTestUser(
      `user${i}@example.com`,
      'Password123!'
    );
    createdUsers.push(user);
  }

  return createdUsers;
}

/**
 * Generates authentication tokens for a test user.
 *
 * @param userId - User's ID
 * @param email - User's email
 * @returns Object with accessToken and refreshToken
 */
export async function generateTestTokens(userId: string, email: string) {
  // Add delay to ensure unique timestamps in JWT tokens (JWT uses seconds precision)
  await new Promise(resolve => setTimeout(resolve, 1100));

  const accessToken = tokenService.generateAccessToken(userId, email);
  const refreshToken = tokenService.generateRefreshToken(userId);

  // Store refresh token in database
  await tokenService.storeRefreshToken(refreshToken, userId);

  return { accessToken, refreshToken };
}

/**
 * Creates a test user with valid authentication tokens.
 *
 * @param email - User's email address
 * @param password - Plain text password
 * @returns User object with tokens
 */
export async function createAuthenticatedTestUser(
  email: string = 'auth@example.com',
  password: string = 'Password123!'
) {
  const user = await createTestUser(email, password);
  const tokens = await generateTestTokens(user.id, user.email);

  return {
    ...user,
    ...tokens,
  };
}

/**
 * Creates an expired refresh token for testing.
 *
 * @param userId - User's ID
 * @returns Expired refresh token
 */
export async function createExpiredRefreshToken(userId: string): Promise<string> {
  const expiredToken = tokenService.generateRefreshToken(userId);

  // Insert with past expiration date
  await testDb.insert(refreshTokens).values({
    token: expiredToken,
    userId,
    expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    isRevoked: false,
  });

  return expiredToken;
}

/**
 * Creates a revoked refresh token for testing.
 *
 * @param userId - User's ID
 * @returns Revoked refresh token
 */
export async function createRevokedRefreshToken(userId: string): Promise<string> {
  const revokedToken = tokenService.generateRefreshToken(userId);

  await testDb.insert(refreshTokens).values({
    token: revokedToken,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
    isRevoked: true,
  });

  return revokedToken;
}
