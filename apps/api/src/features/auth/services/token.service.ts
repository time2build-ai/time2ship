import jwt from 'jsonwebtoken';
import { db } from '@/config/database';
import { refreshTokens } from '../schemas/refresh-token.schema';
import { eq } from 'drizzle-orm';
import { AppError } from '@/common/utils/errors';
import { env } from '@/config/env';
import { TOKEN_EXPIRY } from '@/common/constants';

/**
 * Service for JWT token generation and validation.
 * Handles access tokens, refresh tokens, and token rotation.
 */
export class TokenService {
  private readonly accessSecret = env.JWT_ACCESS_SECRET;
  private readonly refreshSecret = env.JWT_REFRESH_SECRET;

  /**
   * Generates a short-lived JWT access token.
   *
   * @param userId - Unique identifier of the user
   * @param email - User's email address
   * @returns Signed JWT access token valid for 15 minutes
   */
  generateAccessToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, this.accessSecret, {
      expiresIn: TOKEN_EXPIRY.ACCESS,
    });
  }

  /**
   * Generates a long-lived JWT refresh token.
   *
   * @param userId - Unique identifier of the user
   * @returns Signed JWT refresh token valid for 7 days
   */
  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshSecret, {
      expiresIn: TOKEN_EXPIRY.REFRESH,
    });
  }

  /**
   * Stores a refresh token in the database with expiration tracking.
   *
   * @param token - The refresh token string to store
   * @param userId - User ID associated with this token
   */
  async storeRefreshToken(token: string, userId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(refreshTokens).values({
      token,
      userId,
      expiresAt,
    });
  }

  /**
   * Verifies a refresh token and returns the associated user ID.
   *
   * @param token - The refresh token to verify
   * @returns User ID from the token
   * @throws {AppError} If token is invalid, expired, or revoked
   */
  async verifyRefreshToken(token: string): Promise<string> {
    let decoded: any;
    try {
      decoded = jwt.verify(token, this.refreshSecret);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }

    const storedToken = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, token),
    });

    if (!storedToken) {
      throw new AppError('Refresh token not found', 401);
    }

    if (storedToken.isRevoked) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    if (new Date() > storedToken.expiresAt) {
      throw new AppError('Refresh token expired', 401);
    }

    return decoded.userId;
  }

  /**
   * Revokes a specific refresh token.
   *
   * @param token - The token to revoke
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.token, token));
  }

  /**
   * Revokes all refresh tokens for a specific user.
   *
   * @param userId - User ID whose tokens should be revoked
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  /**
   * Verifies an access token and returns the decoded payload.
   *
   * @param token - The access token to verify
   * @returns Decoded token payload containing userId and email
   * @throws {AppError} If token is invalid or expired
   */
  verifyAccessToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, this.accessSecret) as { userId: string; email: string };
    } catch (error) {
      throw new AppError('Invalid or expired access token', 401);
    }
  }
}

export const tokenService = new TokenService();
