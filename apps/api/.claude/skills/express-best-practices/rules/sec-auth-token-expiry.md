# sec-auth-token-expiry

Always set appropriate expiration times for JWT tokens and implement refresh token rotation. Short-lived access tokens with longer-lived refresh tokens provide better security.

## ❌ WRONG

```typescript
// jwt.service.ts - INSECURE
import jwt from 'jsonwebtoken';

export class JwtService {
  // No expiration - token valid forever
  generateToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET!);
  }

  // Extremely long expiration (30 days)
  generateLongLivedToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' } // Too long for access tokens
    );
  }

  // No refresh token mechanism
  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return null; // User must login again even if just expired
    }
  }
}
```

## ✅ CORRECT

```typescript
// jwt.service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '@/db';
import { refreshTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { config } from '@/config/env';

export class JwtService {
  /**
   * Generate short-lived access token (15 minutes)
   */
  generateAccessToken(userId: string): string {
    return jwt.sign(
      {
        userId,
        type: 'access', // Distinguish token types
      },
      config.jwt.secret,
      {
        expiresIn: '15m', // Short-lived
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Generate long-lived refresh token (7 days)
   * Stored in database for revocation capability
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
      token,
      userId,
      expiresAt,
    });

    return token;
  }

  /**
   * Generate token pair for authentication
   */
  async generateTokenPair(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): { userId: string } | null {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
      }) as { userId: string; type: string };

      if (payload.type !== 'access') {
        return null;
      }

      return { userId: payload.userId };
    } catch {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   * Implements refresh token rotation for security
   */
  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token exists and is valid
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          gt(refreshTokens.expiresAt, new Date()),
          eq(refreshTokens.revoked, false)
        )
      )
      .limit(1);

    if (!storedToken) {
      return null;
    }

    // Revoke old refresh token (rotation)
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, refreshToken));

    // Generate new token pair
    return this.generateTokenPair(storedToken.userId);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllTokens(userId: string) {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }
}

// db/schema/refresh-tokens.ts
import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const refreshTokens = pgTable('refresh_tokens', {
  id: varchar('id', { length: 36 }).primaryKey().defaultRandom(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

## Why This Matters

- **Security Impact**: Long-lived tokens increase the window of opportunity for attackers if tokens are stolen. Token expiry limits damage from compromised tokens
- **OWASP Reference**: [A07:2021 - Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- **Access Token**: Keep short (15-30 minutes) to minimize damage if stolen. User experience remains smooth with refresh tokens
- **Refresh Token**: Longer-lived (7-30 days) but stored in database for revocation capability. Should be used only to obtain new access tokens
- **Token Rotation**: Always issue new refresh token when refreshing, and revoke old one. Prevents token reuse attacks
- **Revocation**: Database-stored refresh tokens allow immediate revocation on logout, password change, or security breach
- **Best Practice**: Use httpOnly, secure cookies for refresh tokens in web apps to prevent XSS attacks from stealing tokens
