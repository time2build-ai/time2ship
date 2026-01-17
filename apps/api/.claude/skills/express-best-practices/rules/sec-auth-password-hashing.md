# sec-auth-password-hashing

Always hash passwords using bcrypt or argon2 with appropriate cost factors. Never store passwords in plain text or use weak hashing algorithms like MD5 or SHA-1.

## ❌ WRONG

```typescript
// auth.service.ts - NEVER DO THIS
import crypto from 'crypto';

export class AuthService {
  // Plain text storage - CRITICAL VULNERABILITY
  async createUser(email: string, password: string) {
    return db.insert(users).values({
      email,
      password, // Storing plain text password
    });
  }

  // Weak hashing algorithm
  async createUserWeak(email: string, password: string) {
    const hash = crypto
      .createHash('md5') // MD5 is cryptographically broken
      .update(password)
      .digest('hex');

    return db.insert(users).values({ email, password: hash });
  }

  // SHA-256 without salt - still vulnerable to rainbow tables
  async createUserNoSalt(email: string, password: string) {
    const hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    return db.insert(users).values({ email, password: hash });
  }
}
```

## ✅ CORRECT

```typescript
// auth.service.ts
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12; // Adjust based on security requirements and performance

export class AuthService {
  /**
   * Hash password using bcrypt with salt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create new user with hashed password
   */
  async createUser(email: string, password: string) {
    const hashedPassword = await this.hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword, // Store hash, never plain text
      })
      .returning();

    return user;
  }

  /**
   * Authenticate user
   */
  async authenticateUser(email: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Use constant-time comparison to prevent timing attacks
      await bcrypt.hash(password, SALT_ROUNDS);
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password);

    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Update password with rehashing
   */
  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }
}
```

## Why This Matters

- **Security Impact**: Plain text or weakly hashed passwords can be compromised in data breaches, leading to account takeovers. MD5 and SHA-1 are vulnerable to collision attacks and rainbow tables
- **OWASP Reference**: [A02:2021 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- **bcrypt Advantages**: Built-in salting, adaptive cost factor (can increase work factor as hardware improves), designed to be slow to resist brute-force attacks
- **Cost Factor**: SALT_ROUNDS=12 provides good security/performance balance. Each increment doubles the work. Consider 14+ for high-security applications
- **Timing Attack Prevention**: Always perform the expensive hashing operation even when user doesn't exist to prevent attackers from enumerating valid email addresses
- **Alternative**: Consider argon2 (winner of Password Hashing Competition) for new applications - it's more resistant to GPU/ASIC attacks
