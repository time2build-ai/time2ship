# Express Best Practices - Complete Reference

> **Purpose:** Comprehensive guide for AI agents with all 35 rules expanded inline for quick reference without loading individual files.

## Priority System

Rules are prioritized by impact on production readiness and security:

1. **CRITICAL** - Security vulnerabilities (auth, validation, injection attacks)
2. **HIGH** - Performance bottlenecks (database queries, caching, response optimization)
3. **MEDIUM** - Architecture violations (layering, type safety, error handling)
4. **LOW** - Code quality refinements (naming, imports, consistency)

## Table of Contents

### Security Rules (CRITICAL Priority) - 12 rules
- sec-auth-jwt-secret
- sec-auth-password-hashing
- sec-auth-token-expiry
- sec-authorize-middleware
- sec-input-validation-zod
- sec-sql-injection-drizzle
- sec-xss-prevention
- sec-path-traversal
- sec-secrets-env
- sec-error-leakage
- sec-rate-limiting
- sec-cors-config

### Performance Rules (HIGH Priority) - 10 rules
- perf-n-plus-one
- perf-connection-pooling
- perf-select-specific
- perf-database-indexes
- perf-compression
- perf-pagination
- perf-streaming
- perf-cache-headers
- perf-response-caching
- perf-avoid-blocking

### Architecture Rules (MEDIUM Priority) - 8 rules
- arch-no-business-in-routes
- arch-no-db-in-routes
- arch-services-throw-errors
- arch-no-any-types
- arch-explicit-return-types
- arch-type-inference-zod
- arch-async-handler-wrapper
- arch-custom-error-classes

### Code Quality Rules (LOW Priority) - 5 rules
- quality-import-order
- quality-naming-conventions
- quality-no-magic-values
- quality-feature-structure
- quality-barrel-exports

---


## Security Rules (CRITICAL Priority)

# sec-auth-jwt-secret

Never hardcode JWT secrets or use weak keys. Always use cryptographically strong, randomly generated secrets stored securely in environment variables.

## ❌ WRONG

```typescript
// jwt.service.ts
import jwt from 'jsonwebtoken';

export class JwtService {
  // Hardcoded secret - CRITICAL VULNERABILITY
  private readonly secret = 'my-secret-key';

  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.secret, { expiresIn: '1h' });
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.secret);
  }
}

// OR using a weak secret
const SECRET = 'password123'; // Too weak, easily guessable
```

## ✅ CORRECT

```typescript
// jwt.service.ts
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

export class JwtService {
  // Secret from environment variable
  private readonly secret: string;

  constructor() {
    this.secret = config.jwt.secret;

    // Validate secret strength on initialization
    if (!this.secret || this.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256' // Explicitly specify algorithm
    });
  }

  verifyToken(token: string): { userId: string } {
    return jwt.verify(token, this.secret, {
      algorithms: ['HS256'] // Prevent algorithm confusion attacks
    }) as { userId: string };
  }
}

// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
});

const env = envSchema.parse(process.env);

export const config = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
};

// .env (gitignored!)
// JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3f14e96f8c3a8f5f167f44f4964e6c998
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Why This Matters

- **Security Impact**: Hardcoded secrets can be extracted from source code, version control history, or compiled binaries, allowing attackers to forge valid JWTs and impersonate any user
- **OWASP Reference**: [A02:2021 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- **Best Practice**: Use cryptographically secure random strings (minimum 256 bits / 32 bytes) and rotate secrets regularly
- **Algorithm Confusion**: Always specify and verify the JWT algorithm to prevent attackers from exploiting algorithm confusion vulnerabilities
- **Common Mistake**: Committing `.env` files to git - always add `.env` to `.gitignore` and use `.env.example` for documentation
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
# sec-authorize-middleware

Always implement proper authorization checks after authentication. Verify users have permission to access resources, not just that they're authenticated.

## ❌ WRONG

```typescript
// routes/posts.routes.ts - INSECURE
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';

const router = Router();

// Only checks authentication, not authorization
router.delete('/posts/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Any authenticated user can delete any post!
  await db.delete(posts).where(eq(posts.id, id));

  res.json({ success: true });
});

// No role checking
router.get('/admin/users', authenticate, async (req, res) => {
  // Any authenticated user can access admin endpoint!
  const allUsers = await db.select().from(users);
  res.json(allUsers);
});
```

## ✅ CORRECT

```typescript
// middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'Insufficient permissions',
        403 // Forbidden
      );
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const requireOwnership = (resourceType: 'post' | 'comment') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const resourceId = req.params.id;

    if (resourceType === 'post') {
      const [post] = await db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, resourceId))
        .limit(1);

      if (!post) {
        throw new AppError('Post not found', 404);
      }

      if (post.authorId !== req.user.id) {
        throw new AppError(
          'You do not have permission to modify this post',
          403
        );
      }
    }

    next();
  };
};

/**
 * Flexible policy-based authorization
 */
export const authorize = (
  policy: (req: Request) => boolean | Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const allowed = await policy(req);

    if (!allowed) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

// routes/posts.routes.ts - SECURE
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireOwnership, requireRole } from '@/middleware/authorize';
import { PostsController } from './posts.controller';

const router = Router();
const controller = new PostsController();

// Must be authenticated AND own the post
router.delete(
  '/posts/:id',
  authenticate,
  requireOwnership('post'),
  controller.deletePost
);

// Must be authenticated AND have admin role
router.get(
  '/admin/users',
  authenticate,
  requireRole('admin', 'superadmin'),
  controller.listUsers
);

// Complex authorization using policy
router.post(
  '/posts/:id/publish',
  authenticate,
  authorize(async (req) => {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, req.params.id),
    });

    // User must own post OR be an editor
    return (
      post?.authorId === req.user?.id ||
      req.user?.role === 'editor' ||
      req.user?.role === 'admin'
    );
  }),
  controller.publishPost
);

export default router;

// posts.service.ts - Defense in depth
export class PostsService {
  async deletePost(postId: string, userId: string): Promise<void> {
    // ALWAYS verify ownership in service layer too
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await db.delete(posts).where(eq(posts.id, postId));
  }
}
```

## Why This Matters

- **Security Impact**: Missing authorization checks allow authenticated users to access or modify resources they shouldn't, leading to data breaches and privilege escalation
- **OWASP Reference**: [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- **Authentication vs Authorization**: Authentication verifies WHO you are, Authorization verifies WHAT you can do. Both are required
- **Defense in Depth**: Implement authorization checks at both middleware and service layers. Never trust that middleware alone is sufficient
- **IDOR Prevention**: Insecure Direct Object Reference vulnerabilities occur when you don't verify ownership before operations
- **Role-Based Access Control (RBAC)**: Use roles for broad permissions (admin, user, guest)
- **Ownership-Based Access**: Verify user owns resource before allowing modifications
- **Policy-Based Access Control**: Combine multiple conditions (role + ownership + custom logic) for complex scenarios
# sec-cors-config

Configure CORS (Cross-Origin Resource Sharing) properly to allow only trusted origins. Never use wildcard (*) in production or allow all origins.

## ❌ WRONG

```typescript
// app.ts - INSECURE CORS
import express from 'express';
import cors from 'cors';

const app = express();

// CRITICAL: Allows ALL origins
app.use(cors());

// CRITICAL: Wildcard origin with credentials
app.use(cors({
  origin: '*', // Allows any website to call your API
  credentials: true, // Dangerous with wildcard
}));

// WRONG: Trusting user-provided origin
app.use(cors({
  origin: (origin, callback) => {
    // No validation - trusts any origin
    callback(null, origin);
  },
  credentials: true,
}));

// WRONG: Reflecting origin without validation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin!); // Reflects any origin
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// WRONG: Case-sensitive comparison only
app.use(cors({
  origin: (origin, callback) => {
    // Doesn't handle subdomains or protocol variations
    if (origin === 'https://example.com') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed'));
    }
  },
}));
```

## ✅ CORRECT

```typescript
// config/cors.ts
import { CorsOptions } from 'cors';
import { config } from './env';
import { AppError } from '@/utils/errors';

/**
 * Allowed origins based on environment
 */
const getAllowedOrigins = (): string[] => {
  if (config.app.isDevelopment) {
    // Allow localhost in development
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ];
  }

  if (config.app.isProduction) {
    // Strict whitelist in production
    return [
      'https://example.com',
      'https://www.example.com',
      'https://app.example.com',
    ];
  }

  // Staging/test environments
  return [
    'https://staging.example.com',
    'https://test.example.com',
  ];
};

/**
 * Validate origin against whitelist
 */
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    return true;
  }

  const allowedOrigins = getAllowedOrigins();

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check subdomain pattern (if configured)
  if (config.app.isProduction) {
    // Only allow specific subdomains
    const allowedPattern = /^https:\/\/([a-z0-9-]+\.)?example\.com$/;
    return allowedPattern.test(origin);
  }

  return false;
};

/**
 * CORS configuration
 */
export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(
        new AppError(
          `Origin ${origin} not allowed by CORS`,
          403,
          'CORS_ERROR'
        )
      );
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ],

  // Exposed headers (accessible to client)
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'RateLimit-Limit',
    'RateLimit-Remaining',
  ],

  // Preflight cache duration (seconds)
  maxAge: 86400, // 24 hours

  // Enable preflight across all routes
  preflightContinue: false,

  // Success status for OPTIONS requests
  optionsSuccessStatus: 204,
};

// app.ts - Apply CORS configuration
import express from 'express';
import cors from 'cors';
import { corsConfig } from '@/config/cors';

const app = express();

// Trust proxy to get correct origin from X-Forwarded-* headers
app.set('trust proxy', 1);

// Apply CORS middleware
app.use(cors(corsConfig));

// Alternative: Manual CORS headers for more control
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Total-Count, X-Page-Count'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Advanced: Different CORS for different routes
import { Router } from 'express';

const publicApiRouter = Router();
const adminApiRouter = Router();

// Public API - Allow more origins
publicApiRouter.use(cors({
  origin: (origin, callback) => {
    // More permissive for public APIs
    const allowedDomains = ['example.com', 'partner.com'];
    const isAllowed = allowedDomains.some(domain =>
      origin?.endsWith(domain)
    );
    callback(null, isAllowed);
  },
  credentials: false, // No credentials for public API
}));

// Admin API - Strict CORS
adminApiRouter.use(cors({
  origin: 'https://admin.example.com', // Single origin only
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use('/api/public', publicApiRouter);
app.use('/api/admin', adminApiRouter);

// Environment-specific configuration
// .env.production
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com,https://app.example.com

// .env.development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

// config/env.ts
const envSchema = z.object({
  CORS_ALLOWED_ORIGINS: z
    .string()
    .transform(s => s.split(',').map(o => o.trim()))
    .default('http://localhost:3000'),
  // ... other config
});

// config/cors.ts - Use from environment
const getAllowedOrigins = (): string[] => {
  return config.cors.allowedOrigins;
};

// Testing CORS configuration
// test/cors.test.ts
import request from 'supertest';
import { app } from '@/app';

describe('CORS Configuration', () => {
  it('should allow whitelisted origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');

    expect(response.headers['access-control-allow-origin']).toBe(
      'https://example.com'
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should reject non-whitelisted origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious.com');

    expect(response.status).toBe(403);
  });

  it('should handle preflight requests', async () => {
    const response = await request(app)
      .options('/api/users')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});
```

## Why This Matters

- **Security Impact**: Misconfigured CORS allows malicious websites to make requests to your API on behalf of users, leading to data theft, CSRF attacks, and unauthorized actions
- **OWASP Reference**: [A05:2021 - Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/), [A07:2021 - Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- **Wildcard Danger**: Using origin: '*' with credentials: true is forbidden by browsers and allows any website to access your API
- **Origin Validation**: Always validate origins against a whitelist. Never reflect the Origin header without validation
- **Credentials**: Only enable credentials: true when necessary and with strict origin validation
- **Preflight Requests**: Browsers send OPTIONS requests before actual requests. Handle them properly with correct headers
- **Subdomain Patterns**: Use regex patterns to allow dynamic subdomains (e.g., user1.example.com, user2.example.com) but validate carefully
- **Environment-Specific**: Use different CORS configs for development (permissive) and production (strict)
- **No Origin**: Requests from mobile apps, server-to-server, or tools like Postman don't include an Origin header. Decide whether to allow these
- **Testing**: Always test CORS configuration with actual cross-origin requests from browsers
- **Headers Matter**: Only expose necessary headers in Access-Control-Expose-Headers. Don't expose sensitive headers
- **Cache Preflight**: Set max-age to cache preflight responses and reduce OPTIONS requests
# sec-error-leakage

Never expose sensitive information in error messages. Return generic errors to clients while logging detailed errors securely for debugging.

## ❌ WRONG

```typescript
// routes/auth.routes.ts - INFORMATION LEAKAGE
import { Router } from 'express';

const router = Router();

// Exposing database errors to client
router.post('/login', async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, req.body.email),
    });

    if (!user) {
      // Reveals user existence
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(req.body.password, user.password);

    if (!isValid) {
      // Different message reveals password was wrong but user exists
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ token: generateToken(user.id) });
  } catch (error: any) {
    // CRITICAL: Exposing raw database errors
    res.status(500).json({
      error: error.message, // "column 'password' does not exist"
      stack: error.stack, // Full stack trace with file paths
      query: error.query, // SQL query with parameters
    });
  }
});

// Exposing internal paths
router.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error: any) {
    // Reveals internal file structure
    res.status(500).send(`
      Error in file: ${error.fileName}
      Line: ${error.lineNumber}
      Stack: ${error.stack}
    `);
  }
});

// Verbose validation errors
router.post('/register', async (req, res) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Exposing internal validation logic
    return res.status(400).json({
      errors: result.error.errors, // Full Zod error details
      fields: Object.keys(req.body),
      received: req.body, // Echoing back user input
    });
  }
});
```

## ✅ CORRECT

```typescript
// utils/errors.ts - Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// utils/logger.ts - Structured logging
import winston from 'winston';
import { config } from '@/config/env';

export const logger = winston.createLogger({
  level: config.app.isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs to files
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// In development, also log to console
if (config.app.isDevelopment) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// middleware/error-handler.ts - Global error handler
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';
import { ZodError } from 'zod';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log detailed error for debugging (server-side only)
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id, // If authenticated
    },
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        // Only include details if explicitly set and safe
        ...(error.details && { details: error.details }),
      },
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        // Sanitized validation errors
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    });
  }

  // Handle database errors generically
  if (error.name === 'DatabaseError' || error.name === 'QueryError') {
    logger.error('Database error', { error });
    return res.status(500).json({
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
      },
    });
  }

  // Generic error response for unexpected errors
  // NEVER expose error details in production
  const isDevelopment = config.app.isDevelopment;

  res.status(500).json({
    error: {
      message: isDevelopment
        ? error.message
        : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      // Only include stack trace in development
      ...(isDevelopment && { stack: error.stack }),
    },
  });
};

// routes/auth.routes.ts - SECURE error handling
import { Router } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

// Generic error messages that don't reveal user existence
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input first
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Use same generic message for both cases
  if (!user || !(await bcrypt.compare(password, user.password))) {
    // Log failed attempt with details (server-side)
    logger.warn('Failed login attempt', {
      email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generic client message
    throw new AppError('Invalid email or password', 401, 'AUTH_FAILED');
  }

  // Rate limit failed attempts (see sec-rate-limiting.md)

  const token = generateToken(user.id);
  res.json({ token });
});

// Safe error responses
router.get('/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json(user);
});

// Controlled validation error responses
router.post('/register', async (req, res) => {
  // Validation middleware handles Zod errors
  // and returns sanitized error messages

  const user = await authService.register(req.body);
  res.status(201).json(user);
});

export default router;

// app.ts - Wire up error handler
import express from 'express';
import { errorHandler } from '@/middleware/error-handler';

const app = express();

// ... routes ...

// Error handler must be last middleware
app.use(errorHandler);

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled rejection', {
    error: {
      message: reason.message,
      stack: reason.stack,
    },
  });

  // Optional: Exit process in production
  if (config.app.isProduction) {
    process.exit(1);
  }
});
```

## Why This Matters

- **Security Impact**: Error messages revealing internal details help attackers understand system architecture, identify vulnerabilities, and craft targeted attacks
- **OWASP Reference**: [A04:2021 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/), [A05:2021 - Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- **Information Disclosure**: Stack traces, file paths, database schemas, query syntax, and library versions help attackers
- **User Enumeration**: Different error messages for "user not found" vs "wrong password" allow attackers to enumerate valid users
- **Generic Errors**: Return generic error messages to clients while logging detailed errors server-side for debugging
- **Structured Logging**: Use proper logging libraries (winston, pino) to log errors with context without exposing them to clients
- **Error Codes**: Use error codes (like 'AUTH_FAILED') for client logic without revealing sensitive details
- **Development vs Production**: Show detailed errors only in development. Production should have generic messages
- **Database Errors**: Never expose raw database errors. They reveal schema, table names, and query structure
- **Validation Errors**: Sanitize validation errors to show only necessary field-level feedback without exposing internal logic
# sec-input-validation-zod

Always validate and sanitize all user input using Zod schemas. Never trust client-provided data, including query params, path params, headers, and request bodies.

## ❌ WRONG

```typescript
// routes/users.routes.ts - NO VALIDATION
import { Router } from 'express';

const router = Router();

router.post('/users', async (req, res) => {
  // No validation - trusting client data
  const { email, password, age } = req.body;

  // What if email is not a string? What if age is negative?
  const user = await db.insert(users).values({
    email, // Could be malicious script
    password, // Could be empty string
    age, // Could be -999 or "not a number"
  });

  res.json(user);
});

// Type assertion without validation
router.get('/users/:id', async (req, res) => {
  const id = req.params.id as string; // What if id contains SQL?

  // No validation that id is valid UUID
  const user = await db.select().from(users).where(eq(users.id, id));
  res.json(user);
});

// No query param validation
router.get('/posts', async (req, res) => {
  const limit = req.query.limit; // Could be undefined, "abc", or "999999"
  const offset = req.query.offset;

  // Unsafe to use directly
  const posts = await db
    .select()
    .from(posts)
    .limit(limit) // Type error and potential DoS
    .offset(offset);

  res.json(posts);
});
```

## ✅ CORRECT

```typescript
// middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '@/utils/errors';

export interface ValidatedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
> extends Request {
  body: TBody;
  query: TQuery;
  params: TParams;
}

/**
 * Middleware to validate request with Zod schemas
 */
export const validate = <
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
>(schema: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query params
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // Validate path params
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          'Validation failed',
          400,
          error.errors // Include specific validation errors
        );
      }
      throw error;
    }
  };
};

// schemas/user.schemas.ts
import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    age: z
      .number()
      .int()
      .min(13, 'Must be at least 13 years old')
      .max(120, 'Invalid age')
      .optional(),
    name: z
      .string()
      .min(1, 'Name required')
      .max(100, 'Name too long')
      .trim(),
  }),
};

export const getUserSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
};

export const listPostsSchema = {
  query: z.object({
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .default('10'),
    offset: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0))
      .default('0'),
    sort: z
      .enum(['createdAt', 'updatedAt', 'title'])
      .default('createdAt'),
    order: z
      .enum(['asc', 'desc'])
      .default('desc'),
  }),
};

// routes/users.routes.ts - SECURE
import { Router } from 'express';
import { validate, ValidatedRequest } from '@/middleware/validate';
import { createUserSchema, getUserSchema } from '@/schemas/user.schemas';
import { UsersController } from './users.controller';

const router = Router();
const controller = new UsersController();

// Validated POST request
router.post(
  '/users',
  validate(createUserSchema),
  async (
    req: ValidatedRequest<z.infer<typeof createUserSchema.body>>,
    res
  ) => {
    // req.body is now validated and typed
    const user = await controller.createUser(req.body);
    res.status(201).json(user);
  }
);

// Validated GET with path params
router.get(
  '/users/:id',
  validate(getUserSchema),
  async (
    req: ValidatedRequest<unknown, unknown, z.infer<typeof getUserSchema.params>>,
    res
  ) => {
    // req.params.id is validated UUID
    const user = await controller.getUser(req.params.id);
    res.json(user);
  }
);

// Validated query params
router.get(
  '/posts',
  validate({ query: listPostsSchema.query }),
  async (
    req: ValidatedRequest<unknown, z.infer<typeof listPostsSchema.query>>,
    res
  ) => {
    // req.query is validated and transformed
    const posts = await controller.listPosts(req.query);
    res.json(posts);
  }
);

export default router;
```

## Why This Matters

- **Security Impact**: Unvalidated input is the root cause of most vulnerabilities including SQL injection, XSS, command injection, and business logic bypasses
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/), [A04:2021 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- **Type Safety**: Zod provides runtime validation AND type inference, ensuring TypeScript types match actual data
- **Transform & Sanitize**: Zod can transform data (trim strings, parse numbers) and sanitize input automatically
- **Early Rejection**: Fail fast at the API boundary before data reaches business logic or database
- **Clear Error Messages**: Zod provides detailed validation errors that help clients fix requests
- **Defense Against**: Type confusion, negative numbers where positive expected, missing required fields, malformed UUIDs/emails, oversized input (DoS)
- **Best Practice**: Define all schemas in separate files for reusability and testing. Validate ALL input sources: body, query, params, and even headers when used for logic
# sec-path-traversal

Prevent path traversal attacks by validating file paths and never directly using user input in file operations. Use path normalization and whitelist allowed directories.

## ❌ WRONG

```typescript
// routes/files.routes.ts - PATH TRAVERSAL VULNERABILITY
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// CRITICAL: Using user input directly in file path
router.get('/files/:filename', (req, res) => {
  const { filename } = req.params;

  // Attacker could use: "../../../../etc/passwd"
  const filePath = `./uploads/${filename}`;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    res.send(data);
  });
});

// WRONG: Path.join doesn't prevent traversal
router.get('/downloads/:category/:file', (req, res) => {
  const { category, file } = req.params;

  // Still vulnerable: "../../../etc/passwd"
  const filePath = path.join('./downloads', category, file);

  res.sendFile(filePath);
});

// WRONG: Allowing any file extension
router.post('/upload', upload.single('file'), (req, res) => {
  const filename = req.file?.originalname;

  // Attacker could upload "malware.exe" or "shell.php"
  const destination = `./uploads/${filename}`;

  fs.renameSync(req.file!.path, destination);
  res.json({ path: destination });
});
```

## ✅ CORRECT

```typescript
// utils/file-security.ts
import path from 'path';
import fs from 'fs/promises';
import { AppError } from './errors';

/**
 * Validate and sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove any path separators and null bytes
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .trim();
};

/**
 * Validate file is within allowed directory
 */
export const validateFilePath = (
  filePath: string,
  allowedDir: string
): void => {
  // Resolve absolute paths
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(allowedDir);

  // Ensure file is within allowed directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new AppError(
      'Access denied: Invalid file path',
      403
    );
  }
};

/**
 * Get allowed file extensions
 */
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', // Images
  '.pdf', // Documents
  '.txt', '.md', // Text
]);

/**
 * Validate file extension
 */
export const validateFileExtension = (filename: string): void => {
  const ext = path.extname(filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError(
      `File type not allowed. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
      400
    );
  }
};

/**
 * Safely get file path within uploads directory
 */
export const getSafeFilePath = (
  filename: string,
  baseDir: string = './uploads'
): string => {
  // Sanitize filename
  const safeName = sanitizeFilename(filename);

  if (!safeName) {
    throw new AppError('Invalid filename', 400);
  }

  // Validate extension
  validateFileExtension(safeName);

  // Construct path
  const filePath = path.join(baseDir, safeName);

  // Validate path is within base directory
  validateFilePath(filePath, baseDir);

  return filePath;
};

// schemas/file.schemas.ts
import { z } from 'zod';

export const fileParamsSchema = {
  params: z.object({
    filename: z
      .string()
      .min(1)
      .max(255)
      .regex(
        /^[a-zA-Z0-9-_\.]+$/,
        'Filename can only contain alphanumeric characters, hyphens, underscores, and dots'
      )
      .refine(
        (name) => !name.startsWith('.'),
        'Filename cannot start with a dot'
      )
      .refine(
        (name) => !name.includes('..'),
        'Filename cannot contain ..'
      ),
  }),
};

export const downloadParamsSchema = {
  params: z.object({
    category: z.enum(['images', 'documents', 'exports']),
    filename: z
      .string()
      .regex(/^[a-zA-Z0-9-_\.]+$/)
      .refine((name) => !name.includes('..')),
  }),
};

// routes/files.routes.ts - SECURE
import { Router, Request, Response } from 'express';
import { validate } from '@/middleware/validate';
import { fileParamsSchema, downloadParamsSchema } from '@/schemas/file.schemas';
import { getSafeFilePath, validateFileExtension } from '@/utils/file-security';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

const router = Router();

// Secure file download
router.get(
  '/files/:filename',
  validate(fileParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const filePath = getSafeFilePath(req.params.filename);

      // Verify file exists
      await fs.access(filePath);

      // Send file with proper content-type
      res.sendFile(path.resolve(filePath), {
        dotfiles: 'deny', // Prevent accessing hidden files
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      throw error;
    }
  }
);

// Secure categorized downloads with whitelisted categories
router.get(
  '/downloads/:category/:filename',
  validate(downloadParamsSchema),
  async (req: Request, res: Response) => {
    const { category, filename } = req.params;

    // Whitelist of allowed directories
    const categoryDirs: Record<string, string> = {
      images: './uploads/images',
      documents: './uploads/documents',
      exports: './uploads/exports',
    };

    const baseDir = categoryDirs[category];
    const filePath = getSafeFilePath(filename, baseDir);

    // Verify file exists
    await fs.access(filePath);

    res.sendFile(path.resolve(filePath), {
      dotfiles: 'deny',
    });
  }
);

// Secure file upload with extension validation
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads/temp';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with safe characters
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${nanoid()}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      validateFileExtension(file.originalname);
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
});

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Additional validation
    validateFileExtension(req.file.filename);

    // Move to permanent location with safe path
    const finalDir = './uploads/files';
    await fs.mkdir(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, req.file.filename);
    validateFilePath(finalPath, finalDir);

    await fs.rename(req.file.path, finalPath);

    res.status(201).json({
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  }
);

export default router;
```

## Why This Matters

- **Security Impact**: Path traversal allows attackers to read/write files outside intended directories, leading to source code disclosure, configuration file theft, password file access, and arbitrary file upload
- **OWASP Reference**: [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- **Path Resolution**: Always resolve paths to absolute paths and verify they're within the allowed directory tree
- **Sanitization**: Remove path separators (/, \), parent directory references (..), and null bytes from user input
- **Whitelist Approach**: Use enums or whitelists for categories/directories rather than accepting arbitrary paths
- **File Extensions**: Validate and whitelist allowed file extensions to prevent uploading executable files
- **Unique Filenames**: Generate unique filenames instead of using user-provided names to prevent overwriting and collisions
- **Defense in Depth**: Combine filename sanitization, path validation, extension whitelisting, and file size limits
- **Common Attacks**: ../../../etc/passwd, %2e%2e%2f (URL encoded), ..\/..\/windows/system32, ..\..\..\
# sec-rate-limiting

Implement rate limiting to prevent brute force attacks, API abuse, and DDoS. Use different limits for authentication endpoints, API endpoints, and resource-intensive operations.

## ❌ WRONG

```typescript
// app.ts - NO RATE LIMITING
import express from 'express';

const app = express();

// No protection against brute force
app.post('/login', async (req, res) => {
  // Attacker can try unlimited passwords
  const user = await authenticateUser(req.body.email, req.body.password);
  res.json({ token: user.token });
});

// No protection against API abuse
app.get('/api/users', async (req, res) => {
  // Attacker can make unlimited requests, causing DoS
  const users = await db.select().from(users);
  res.json(users);
});

// Resource-intensive operation without limits
app.post('/api/reports/generate', async (req, res) => {
  // Expensive operation can be triggered unlimited times
  const report = await generateLargeReport(req.body);
  res.json(report);
});
```

## ✅ CORRECT

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { config } from '@/config/env';
import { AppError } from '@/utils/errors';

// Redis client for distributed rate limiting
const redis = config.redis.url
  ? new Redis(config.redis.url)
  : undefined;

/**
 * Create rate limiter with Redis store for distributed systems
 */
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers

    // Use Redis store if available, otherwise memory store
    store: redis
      ? new RedisStore({
          client: redis,
          prefix: 'rate-limit:',
        })
      : undefined,

    skipSuccessfulRequests: options.skipSuccessfulRequests,
    skipFailedRequests: options.skipFailedRequests,

    // Customize error response
    handler: (req, res) => {
      throw new AppError(
        options.message || 'Too many requests, please try again later',
        429, // Too Many Requests
        'RATE_LIMIT_EXCEEDED'
      );
    },
  });
};

/**
 * Global rate limiter - applies to all requests
 * Prevents general API abuse
 */
export const globalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later',
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Rate limiter for password reset
 */
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
});

/**
 * Rate limiter for resource-intensive operations
 */
export const expensiveOperationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 expensive operations per hour
  message: 'Rate limit exceeded for this operation',
});

/**
 * Per-user rate limiter (requires authentication)
 */
export const createUserRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,

    // Key by user ID instead of IP
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },

    store: redis
      ? new RedisStore({
          client: redis,
          prefix: 'rate-limit:user:',
        })
      : undefined,

    handler: (req, res) => {
      throw new AppError(
        options.message || 'Rate limit exceeded',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    },
  });
};

// middleware/slow-down.ts - Gradual slowdown before hard limit
import slowDown from 'express-slow-down';

/**
 * Slow down repeated requests before hitting rate limit
 * Adds increasing delay to responses
 */
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // Start slowing down after 3 requests
  delayMs: 500, // Add 500ms delay per request
  maxDelayMs: 5000, // Maximum 5 second delay
});

// app.ts - Apply rate limiters
import express from 'express';
import { globalRateLimit } from '@/middleware/rate-limit';

const app = express();

// Apply global rate limit to all routes
if (config.app.isProduction) {
  app.use(globalRateLimit);
}

// Trust proxy if behind load balancer/reverse proxy
app.set('trust proxy', 1);

// routes/auth.routes.ts - Apply specific rate limits
import { Router } from 'express';
import {
  authRateLimit,
  authSlowDown,
  passwordResetRateLimit,
} from '@/middleware/rate-limit';

const router = Router();

// Strict rate limiting for login
router.post(
  '/login',
  authSlowDown, // Slow down after 3 attempts
  authRateLimit, // Hard limit at 5 attempts
  async (req, res) => {
    const token = await authService.login(req.body);
    res.json({ token });
  }
);

// Rate limit registration
router.post(
  '/register',
  authRateLimit,
  async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  }
);

// Rate limit password reset
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  async (req, res) => {
    await authService.sendPasswordReset(req.body.email);
    res.json({ message: 'Password reset email sent' });
  }
);

export default router;

// routes/reports.routes.ts - Rate limit expensive operations
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import {
  expensiveOperationRateLimit,
  createUserRateLimit,
} from '@/middleware/rate-limit';

const router = Router();

// Per-user rate limit for report generation
const reportGenerationLimit = createUserRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reports per user per hour
  message: 'Report generation limit exceeded, please try again later',
});

router.post(
  '/reports/generate',
  authenticate,
  reportGenerationLimit,
  async (req, res) => {
    const report = await reportsService.generate(req.body, req.user!.id);
    res.json(report);
  }
);

// Global rate limit for exports
router.get(
  '/exports/:id',
  authenticate,
  expensiveOperationRateLimit,
  async (req, res) => {
    const exportData = await exportsService.get(req.params.id);
    res.json(exportData);
  }
);

export default router;

// Advanced: Account-level rate limiting with custom store
import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export class DatabaseRateLimitStore {
  async increment(key: string): Promise<number> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);

    // Clean old entries
    await db
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.key, key),
          gt(rateLimits.createdAt, windowStart)
        )
      );

    // Insert new entry
    await db.insert(rateLimits).values({ key, createdAt: now });

    // Count attempts in window
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.key, key),
          gt(rateLimits.createdAt, windowStart)
        )
      );

    return result.count;
  }
}
```

## Why This Matters

- **Security Impact**: Without rate limiting, attackers can perform brute force attacks, enumerate users, abuse APIs, and cause denial of service through resource exhaustion
- **OWASP Reference**: [A07:2021 - Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- **Brute Force Prevention**: Rate limiting authentication endpoints prevents password guessing attacks
- **API Abuse**: Prevents malicious users from overwhelming your API with requests
- **Resource Protection**: Limits expensive operations (reports, exports, searches) that could cause performance issues
- **Distributed Systems**: Use Redis store for rate limiting across multiple server instances
- **IP-Based vs User-Based**: Use IP-based limits for unauthenticated endpoints, user-based limits for authenticated endpoints
- **Gradual Slowdown**: express-slow-down adds delays before hitting hard limits, providing better UX
- **Standard Headers**: Return RateLimit-* headers so clients know their limits
- **Trust Proxy**: Configure trust proxy when behind load balancers to get real client IPs
- **Different Tiers**: Apply stricter limits to authentication (5/15min) than general API (100/15min)
- **Skip Successful Requests**: For login endpoints, only count failed attempts to avoid punishing legitimate users
# sec-secrets-env

Never commit secrets to version control. Use environment variables, validate them at startup, and implement different configurations for different environments.

## ❌ WRONG

```typescript
// config/database.ts - SECRETS COMMITTED
export const dbConfig = {
  host: 'prod-db.example.com',
  port: 5432,
  database: 'myapp',
  username: 'admin',
  password: 'SuperSecret123!', // CRITICAL: Hardcoded password
};

// config/services.ts
export const apiKeys = {
  stripe: 'sk_live_4eC39HqLyjWDarjtT1zdp7dc', // CRITICAL: API key in code
  sendgrid: 'SG.abc123xyz', // CRITICAL: API key in code
  aws: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE', // CRITICAL: AWS credentials
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
};

// app.ts
app.use(session({
  secret: 'my-session-secret', // Hardcoded session secret
  resave: false,
  saveUninitialized: false,
}));

// .env file committed to git
// DATABASE_URL=postgresql://admin:SuperSecret123@prod-db.example.com:5432/myapp
```

## ✅ CORRECT

```typescript
// .gitignore - CRITICAL: Always ignore .env files
.env
.env.local
.env.*.local
.env.production
.env.development
*.pem
*.key

# config/env.ts - Environment variable validation
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('3000'),

  // Database
  DATABASE_URL: z.string().url().min(1),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // API Keys (validation without exposing in errors)
  STRIPE_SECRET_KEY: z.string().min(1).startsWith('sk_'),
  SENDGRID_API_KEY: z.string().min(1).startsWith('SG.'),

  // AWS (optional in development)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // Session
  SESSION_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
});

/**
 * Parse and validate environment variables
 * Fails fast on startup if configuration is invalid
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

/**
 * Type-safe configuration object
 */
export const config = {
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },

  database: {
    url: env.DATABASE_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  services: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
    },
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
    },
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    },
  },

  session: {
    secret: env.SESSION_SECRET,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  redis: {
    url: env.REDIS_URL,
  },
} as const;

// app.ts - Using validated config
import express from 'express';
import session from 'express-session';
import { config } from '@/config/env';

const app = express();

app.use(session({
  secret: config.session.secret, // From environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.app.isProduction, // Only HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// .env.example - Template for developers (safe to commit)
# App Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-secure-jwt-secret-at-least-32-chars
JWT_EXPIRES_IN=15m

# API Keys
STRIPE_SECRET_KEY=sk_test_your_test_key
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# AWS (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Session (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your-secure-session-secret-at-least-32-chars

# CORS
CORS_ORIGIN=http://localhost:3000

# Redis (optional)
REDIS_URL=redis://localhost:6379

// scripts/generate-secrets.ts - Helper to generate secure secrets
import crypto from 'crypto';

console.log('Generated secrets for .env:');
console.log('');
console.log(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('');
console.log('⚠️  Never commit these to version control!');

// package.json
{
  "scripts": {
    "generate-secrets": "tsx scripts/generate-secrets.ts",
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

## Why This Matters

- **Security Impact**: Committed secrets in version control can be discovered by attackers through git history, leaked repos, or insider access, leading to complete system compromise
- **OWASP Reference**: [A05:2021 - Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- **Git History**: Even if you remove secrets in a new commit, they remain in git history forever (unless you rewrite history)
- **Validation on Startup**: Fail fast if required environment variables are missing or invalid. Better to crash on startup than fail in production
- **Type Safety**: Zod provides runtime validation AND TypeScript type inference for configuration
- **.env.example**: Provide a template file (without secrets) so developers know what variables are needed
- **Secret Rotation**: With env-based secrets, you can rotate credentials without code changes
- **Environment-Specific**: Use different .env files for development, staging, and production
- **Secret Management**: For production, consider using secret management tools like AWS Secrets Manager, HashiCorp Vault, or similar
- **CI/CD**: In CI/CD pipelines, inject secrets as environment variables, never commit them to config files

## Why This Matters

- **Security Impact**: Committed secrets in version control can be discovered by attackers through git history, leaked repos, or insider access, leading to complete system compromise
- **OWASP Reference**: [A05:2021 - Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- **Git History**: Even if you remove secrets in a new commit, they remain in git history forever (unless you rewrite history)
- **Validation on Startup**: Fail fast if required environment variables are missing or invalid. Better to crash on startup than fail in production
- **Type Safety**: Zod provides runtime validation AND TypeScript type inference for configuration
- **.env.example**: Provide a template file (without secrets) so developers know what variables are needed
- **Secret Rotation**: With env-based secrets, you can rotate credentials without code changes
- **Environment-Specific**: Use different .env files for development, staging, and production
- **Secret Management**: For production, consider using secret management tools like AWS Secrets Manager, HashiCorp Vault, or similar
- **CI/CD**: In CI/CD pipelines, inject secrets as environment variables, never commit them to config files
# sec-sql-injection-drizzle

Always use Drizzle's query builder with parameterized queries. Never concatenate user input into raw SQL strings, even with Drizzle's sql operator.

## ❌ WRONG

```typescript
// users.service.ts - SQL INJECTION VULNERABILITY
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export class UsersService {
  // CRITICAL: String concatenation in raw SQL
  async searchUsers(searchTerm: string) {
    // Attacker could inject: "'; DROP TABLE users; --"
    return db.execute(
      sql.raw(`SELECT * FROM users WHERE name LIKE '%${searchTerm}%'`)
    );
  }

  // WRONG: Template literal with user input
  async getUserByEmail(email: string) {
    // Vulnerable to SQL injection
    return db.execute(
      sql`SELECT * FROM users WHERE email = '${email}'`
    );
  }

  // WRONG: Dynamic column/table names from user input
  async sortUsers(sortColumn: string, order: string) {
    // Attacker could inject malicious column names
    return db.execute(
      sql.raw(`SELECT * FROM users ORDER BY ${sortColumn} ${order}`)
    );
  }
}
```

## ✅ CORRECT

```typescript
// users.service.ts - SECURE
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, sql, asc, desc } from 'drizzle-orm';

export class UsersService {
  /**
   * Search users using parameterized queries
   */
  async searchUsers(searchTerm: string) {
    // Drizzle automatically parameterizes the value
    return db
      .select()
      .from(users)
      .where(
        or(
          like(users.name, `%${searchTerm}%`),
          like(users.email, `%${searchTerm}%`)
        )
      );
  }

  /**
   * Get user by email with parameterized query
   */
  async getUserByEmail(email: string) {
    // The eq() operator safely parameterizes the value
    return db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
  }

  /**
   * Sort users with whitelisted columns
   */
  async sortUsers(
    sortColumn: 'name' | 'email' | 'createdAt',
    order: 'asc' | 'desc'
  ) {
    // Whitelist allowed columns using type system
    const columnMap = {
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    };

    const column = columnMap[sortColumn];
    const orderFn = order === 'asc' ? asc : desc;

    return db
      .select()
      .from(users)
      .orderBy(orderFn(column));
  }

  /**
   * If raw SQL is absolutely necessary, use sql.placeholder()
   */
  async complexQuery(userId: string, status: string) {
    // Use placeholders for user input
    return db.execute(
      sql`
        SELECT u.*, COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        WHERE u.id = ${sql.placeholder('userId')}
          AND u.status = ${sql.placeholder('status')}
        GROUP BY u.id
      `,
      { userId, status } // Parameters passed separately
    );
  }

  /**
   * Full-text search with proper escaping
   */
  async fullTextSearch(query: string) {
    // Use Drizzle's sql operator with parameterization
    return db
      .select()
      .from(users)
      .where(
        sql`to_tsvector('english', ${users.name} || ' ' || ${users.bio})
            @@ plainto_tsquery('english', ${query})`
      );
  }

  /**
   * Dynamic WHERE conditions built safely
   */
  async filterUsers(filters: {
    email?: string;
    status?: string;
    minAge?: number;
  }) {
    const conditions = [];

    if (filters.email) {
      conditions.push(eq(users.email, filters.email));
    }

    if (filters.status) {
      conditions.push(eq(users.status, filters.status));
    }

    if (filters.minAge) {
      conditions.push(sql`${users.age} >= ${filters.minAge}`);
    }

    return db
      .select()
      .from(users)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);
  }
}
```

## Why This Matters

- **Security Impact**: SQL injection allows attackers to execute arbitrary SQL commands, leading to data theft, data manipulation, authentication bypass, and complete system compromise
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/)
- **Drizzle Protection**: Query builder methods (eq, like, gt, etc.) automatically parameterize values, making SQL injection impossible
- **Raw SQL Danger**: Even with Drizzle, using sql.raw() or template literals with user input creates vulnerabilities
- **Whitelist Approach**: For dynamic column names or table names, use a whitelist/map of allowed values rather than accepting user input directly
- **sql.placeholder()**: When raw SQL is necessary, use placeholders to separate SQL structure from data
- **Common Mistake**: Developers sometimes think ORMs prevent all SQL injection, but improper use of raw SQL features can still create vulnerabilities
- **Defense in Depth**: Combine parameterized queries with input validation (see sec-input-validation-zod.md) and principle of least privilege database permissions
# sec-xss-prevention

Prevent Cross-Site Scripting (XSS) by sanitizing output, setting proper Content-Type headers, and implementing Content Security Policy (CSP). Never render user input as HTML without sanitization.

## ❌ WRONG

```typescript
// routes/comments.routes.ts - XSS VULNERABLE
import { Router } from 'express';

const router = Router();

// Rendering user input as HTML
router.get('/comments/:id', async (req, res) => {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, req.params.id));

  // CRITICAL: Sending HTML with user content
  // If comment.text contains "<script>alert('XSS')</script>", it will execute
  res.send(`
    <html>
      <body>
        <h1>${comment.title}</h1>
        <p>${comment.text}</p>
      </body>
    </html>
  `);
});

// Reflected XSS in error messages
router.get('/search', async (req, res) => {
  const { q } = req.query;

  // Reflecting user input in response
  res.send(`
    <p>No results found for: ${q}</p>
  `);
});

// Setting wrong Content-Type
router.get('/api/comments/:id', async (req, res) => {
  const comment = await getComment(req.params.id);

  // Wrong Content-Type allows browser to interpret JSON as HTML
  res.setHeader('Content-Type', 'text/html');
  res.send(JSON.stringify(comment));
});
```

## ✅ CORRECT

```typescript
// middleware/security-headers.ts
import helmet from 'helmet';
import { Application } from 'express';

/**
 * Configure security headers including CSP
 */
export const setupSecurityHeaders = (app: Application) => {
  // Use Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"], // No inline scripts
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true, // X-Content-Type-Options: nosniff
      xssFilter: true, // X-XSS-Protection: 1; mode=block
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
};

// utils/sanitize.ts
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML input to prevent XSS
 */
export const sanitizeUserHtml = (dirty: string): string => {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br',
      'ul', 'ol', 'li', 'blockquote', 'code'
    ],
    allowedAttributes: {
      'a': ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Disallow any protocols that could execute JavaScript
    disallowedTagsMode: 'escape',
  });
};

/**
 * Strip all HTML tags
 */
export const stripHtml = (text: string): string => {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

// routes/comments.routes.ts - SECURE
import { Router } from 'express';
import { sanitizeUserHtml, stripHtml } from '@/utils/sanitize';

const router = Router();

// API endpoints always return JSON with correct Content-Type
router.get('/api/comments/:id', async (req, res) => {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, req.params.id));

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // Express automatically sets Content-Type: application/json
  // Client-side should handle escaping when rendering
  res.json(comment);
});

// If serving HTML, use a template engine with auto-escaping
import { render } from 'ejs'; // or Handlebars, Pug, etc.

router.get('/comments/:id', async (req, res) => {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, req.params.id));

  // Template engines auto-escape by default
  const html = render(
    '<h1><%= title %></h1><p><%= text %></p>',
    {
      title: comment.title, // Auto-escaped
      text: comment.text,   // Auto-escaped
    }
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Sanitize rich text content from users
router.post('/api/comments', async (req, res) => {
  const { text } = req.body;

  // Allow limited HTML tags, sanitize everything else
  const sanitizedText = sanitizeUserHtml(text);

  const [comment] = await db
    .insert(comments)
    .values({
      text: sanitizedText,
      authorId: req.user!.id,
    })
    .returning();

  res.status(201).json(comment);
});

// Search endpoint with safe error messages
router.get('/api/search', async (req, res) => {
  const { q } = req.query as { q: string };

  const results = await searchComments(q);

  // Return JSON, never reflect input in HTML
  res.json({
    query: q, // Client handles escaping
    results,
    count: results.length,
  });
});

// For truly user-generated HTML (like blog posts), sanitize on save
import { CommentsService } from './comments.service';

export class CommentsController {
  async createRichComment(req: Request, res: Response) {
    const { htmlContent } = req.body;

    // Sanitize HTML on input
    const safeHtml = sanitizeUserHtml(htmlContent);

    const comment = await new CommentsService().create({
      content: safeHtml,
      authorId: req.user!.id,
    });

    res.status(201).json(comment);
  }
}

export default router;
```

## Why This Matters

- **Security Impact**: XSS allows attackers to execute malicious JavaScript in victims' browsers, leading to session hijacking, credential theft, defacement, and malware distribution
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/) (XSS is a type of injection attack)
- **Content-Type Matters**: Always set correct Content-Type headers. Browsers may try to "sniff" content type, potentially interpreting JSON as HTML
- **CSP Protection**: Content Security Policy headers prevent inline scripts from executing, mitigating many XSS attacks even if sanitization fails
- **API Best Practice**: APIs should return JSON and let clients handle rendering. Never render user content server-side without escaping
- **Template Engines**: Modern template engines (EJS, Handlebars, React, Vue) auto-escape by default. Never disable this feature
- **Sanitization vs Escaping**: Escaping converts special characters (&lt; &gt;). Sanitization allows safe HTML tags but removes dangerous ones
- **Rich Text Editors**: If users need formatting (bold, links), use a whitelist-based HTML sanitizer like sanitize-html
- **Defense in Depth**: Use multiple layers: input validation, output encoding, CSP headers, HttpOnly cookies, and X-XSS-Protection headers

## Why This Matters

- **Security Impact**: XSS allows attackers to execute malicious JavaScript in victims' browsers, leading to session hijacking, credential theft, defacement, and malware distribution
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/) (XSS is a type of injection attack)
- **Content-Type Matters**: Always set correct Content-Type headers. Browsers may try to "sniff" content type, potentially interpreting JSON as HTML
- **CSP Protection**: Content Security Policy headers prevent inline scripts from executing, mitigating many XSS attacks even if sanitization fails
- **API Best Practice**: APIs should return JSON and let clients handle rendering. Never render user content server-side without escaping
- **Template Engines**: Modern template engines (EJS, Handlebars, React, Vue) auto-escape by default. Never disable this feature
- **Sanitization vs Escaping**: Escaping converts special characters (&lt; &gt;). Sanitization allows safe HTML tags but removes dangerous ones
- **Rich Text Editors**: If users need formatting (bold, links), use a whitelist-based HTML sanitizer like sanitize-html
- **Defense in Depth**: Use multiple layers: input validation, output encoding, CSP headers, HttpOnly cookies, and X-XSS-Protection headers

---

## Performance Rules (HIGH Priority)

# perf-avoid-blocking

Avoid blocking the Node.js event loop with CPU-intensive synchronous operations by offloading heavy work to worker threads, child processes, or async alternatives.

## ❌ WRONG

```typescript
// BAD: Synchronous crypto blocks event loop
import crypto from 'crypto';

export async function hashPasswordSync(req: Request, res: Response) {
  const { password } = req.body;

  // Blocks event loop for 100-500ms
  const hash = crypto.pbkdf2Sync(
    password,
    'salt',
    100000,
    64,
    'sha512'
  );

  // All other requests wait during this time
  res.json({ hash: hash.toString('hex') });
}

// BAD: Heavy JSON parsing blocks event loop
export async function processLargeData(req: Request, res: Response) {
  const largeFile = fs.readFileSync('./data/large.json', 'utf-8');

  // Blocks event loop while parsing 50MB JSON
  const data = JSON.parse(largeFile);

  // Process data...
  res.json({ processed: data.length });
}

// BAD: Synchronous file operations
export async function readFiles(req: Request, res: Response) {
  const files = fs.readdirSync('./uploads'); // Blocks

  const contents = files.map(file =>
    fs.readFileSync(`./uploads/${file}`, 'utf-8') // Blocks for each file
  );

  res.json({ files: contents });
}

// BAD: CPU-intensive computation
export async function calculatePrimes(req: Request, res: Response) {
  const { limit } = req.query;

  // Blocks event loop for seconds
  function isPrime(n: number): boolean {
    for (let i = 2; i < n; i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  const primes = [];
  for (let i = 2; i < Number(limit); i++) {
    if (isPrime(i)) primes.push(i);
  }

  res.json({ primes });
}
```

## ✅ CORRECT

```typescript
// GOOD: Use async crypto
import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(crypto.pbkdf2);

export async function hashPasswordAsync(req: Request, res: Response) {
  const { password } = req.body;

  // Non-blocking - uses libuv thread pool
  const hash = await pbkdf2Async(
    password,
    'salt',
    100000,
    64,
    'sha512'
  );

  res.json({ hash: hash.toString('hex') });
}

// GOOD: Stream large JSON instead of loading all at once
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import JSONStream from 'JSONStream';

export async function processLargeDataStreaming(req: Request, res: Response) {
  const stream = createReadStream('./data/large.json', 'utf-8');
  const parser = JSONStream.parse('*');

  let count = 0;
  parser.on('data', (data) => {
    count++;
    // Process each item without blocking
  });

  await pipeline(stream, parser);

  res.json({ processed: count });
}

// GOOD: Use async file operations
import fs from 'fs/promises';

export async function readFilesAsync(req: Request, res: Response) {
  // Non-blocking directory read
  const files = await fs.readdir('./uploads');

  // Read files in parallel, non-blocking
  const contents = await Promise.all(
    files.map(file => fs.readFile(`./uploads/${file}`, 'utf-8'))
  );

  res.json({ files: contents });
}

// BETTER: Use worker threads for CPU-intensive tasks
import { Worker } from 'worker_threads';
import path from 'path';

function runWorker(workerData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.resolve(__dirname, './workers/primes.worker.js'),
      { workerData }
    );

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

export async function calculatePrimesWorker(req: Request, res: Response) {
  const { limit } = req.query;

  // Offload to worker thread - doesn't block event loop
  const primes = await runWorker({ limit: Number(limit) });

  res.json({ primes });
}

// Worker file: workers/primes.worker.js
import { parentPort, workerData } from 'worker_threads';

function isPrime(n: number): boolean {
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

const primes = [];
for (let i = 2; i < workerData.limit; i++) {
  if (isPrime(i)) primes.push(i);
}

parentPort?.postMessage(primes);

// BEST: Use worker pool for repeated tasks
import { Worker } from 'worker_threads';

class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ data: any; resolve: Function; reject: Function }> = [];
  private activeWorkers = 0;

  constructor(
    private workerPath: string,
    private poolSize: number = 4
  ) {}

  async exec(data: any): Promise<any> {
    if (this.activeWorkers < this.poolSize) {
      return this.runTask(data);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
    });
  }

  private async runTask(data: any): Promise<any> {
    this.activeWorkers++;

    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerPath, { workerData: data });

      worker.on('message', (result) => {
        resolve(result);
        worker.terminate();
        this.activeWorkers--;
        this.processQueue();
      });

      worker.on('error', (err) => {
        reject(err);
        worker.terminate();
        this.activeWorkers--;
        this.processQueue();
      });
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.activeWorkers < this.poolSize) {
      const { data, resolve, reject } = this.queue.shift()!;
      this.runTask(data).then(resolve).catch(reject);
    }
  }

  async terminate() {
    // Wait for active tasks to complete
    while (this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Usage
const primeWorkerPool = new WorkerPool(
  path.resolve(__dirname, './workers/primes.worker.js'),
  4 // 4 worker threads
);

export async function calculatePrimesPooled(req: Request, res: Response) {
  const { limit } = req.query;

  const primes = await primeWorkerPool.exec({ limit: Number(limit) });

  res.json({ primes });
}

// ALTERNATIVE: Use job queue for background processing
import { Queue, Worker as BullWorker } from 'bullmq';

const heavyTaskQueue = new Queue('heavy-tasks', {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Add job to queue
export async function processInBackground(req: Request, res: Response) {
  const { data } = req.body;

  const job = await heavyTaskQueue.add('process-data', data);

  // Return immediately, process in background
  res.json({
    jobId: job.id,
    status: 'queued',
  });
}

// Worker processes jobs in background
const worker = new BullWorker('heavy-tasks', async (job) => {
  // Heavy processing here - doesn't block API
  const result = await heavyComputation(job.data);
  return result;
}, {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});
```

## Why This Matters

- **Event Loop Blocking**:
  - Node.js is single-threaded; blocking operations freeze ALL requests
  - 100ms blocking operation = all concurrent requests delayed by 100ms
  - Can cause cascading failures and timeouts
- **Performance Impact**:
  - Sync crypto (100ms) @ 100 req/sec = queue backlog, timeouts
  - Async crypto (0ms blocking) @ 100 req/sec = smooth operation
- **Common Blocking Operations**:
  - `crypto.pbkdf2Sync`, `bcrypt.hashSync`
  - `JSON.parse()` on large payloads (>1MB)
  - `fs.readFileSync()`, `fs.writeFileSync()`
  - Large loops, heavy computations
  - Synchronous compression/decompression
- **Solutions by Use Case**:
  - **I/O operations**: Use async versions (`fs.promises`, `crypto` async methods)
  - **CPU-intensive**: Worker threads or child processes
  - **Long-running**: Job queues (Bull, BullMQ)
  - **Large data**: Streaming APIs
- **Worker Threads**:
  - Run JavaScript in parallel threads
  - Don't share memory (message passing only)
  - Ideal for CPU-bound tasks
  - Overhead: ~10-50ms to spawn worker
  - Use worker pools for repeated tasks
- **Monitoring**: Use `process.hrtime()` to measure event loop delay
- **Best Practices**:
  - Async by default
  - Stream large files
  - Use worker threads for computations >50ms
  - Consider job queues for tasks >1 second
  - Monitor event loop lag in production
# perf-cache-headers

Set appropriate Cache-Control and ETag headers to enable browser and CDN caching, reducing server load and improving client-side performance.

## ❌ WRONG

```typescript
// BAD: No caching headers - every request hits server
export async function getPublicPost(req: Request, res: Response) {
  const { id } = req.params;

  const post = await db.query.posts.findFirst({
    where: (posts, { eq }) => eq(posts.id, id),
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // No cache headers - browser re-fetches every time
  res.json({ post });
}

// BAD: Static files without caching
app.use('/uploads', express.static('uploads'));
// Files re-downloaded every page load
```

## ✅ CORRECT

```typescript
// GOOD: Cache public, immutable content aggressively
export async function getPublicPost(req: Request, res: Response) {
  const { id } = req.params;

  const post = await db.query.posts.findFirst({
    where: (posts, { eq }) => eq(posts.id, id),
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Cache for 1 hour, allow CDN caching
  res.setHeader('Cache-Control', 'public, max-age=3600');

  // ETag for conditional requests
  const etag = `"${post.id}-${post.updatedAt.getTime()}"`;
  res.setHeader('ETag', etag);

  // Check if client has fresh version
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }

  res.json({ post });
}

// GOOD: Cache static assets with long expiry
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',           // Cache for 1 year
  immutable: true,        // Content never changes
  etag: true,             // Enable ETag
  lastModified: true,     // Enable Last-Modified
}));

// GOOD: Different caching strategies per route type
import { cacheControl } from './middleware/cacheControl';

// Public, static content - cache aggressively
app.get('/api/posts/:id',
  cacheControl({ public: true, maxAge: 3600 }),
  getPublicPost
);

// User-specific content - cache privately
app.get('/api/users/me',
  authenticateUser,
  cacheControl({ private: true, maxAge: 300 }),
  getCurrentUser
);

// Frequently changing content - short cache + revalidation
app.get('/api/posts/feed',
  cacheControl({ public: true, maxAge: 60, mustRevalidate: true }),
  getPostFeed
);

// Sensitive content - no caching
app.get('/api/admin/users',
  authorizeAdmin,
  cacheControl({ noStore: true }),
  getAdminUsers
);

// Middleware implementation
interface CacheOptions {
  public?: boolean;
  private?: boolean;
  maxAge?: number;      // seconds
  sMaxAge?: number;     // CDN cache time
  noStore?: boolean;
  noCache?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

export function cacheControl(options: CacheOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parts: string[] = [];

    if (options.public) parts.push('public');
    if (options.private) parts.push('private');
    if (options.noStore) parts.push('no-store');
    if (options.noCache) parts.push('no-cache');
    if (options.mustRevalidate) parts.push('must-revalidate');
    if (options.immutable) parts.push('immutable');

    if (options.maxAge !== undefined) {
      parts.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge !== undefined) {
      parts.push(`s-maxage=${options.sMaxAge}`);
    }

    res.setHeader('Cache-Control', parts.join(', '));
    next();
  };
}

// GOOD: Conditional request support
import crypto from 'crypto';

export function withETag(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      // Generate ETag from response body
      const etag = `"${crypto
        .createHash('md5')
        .update(JSON.stringify(body))
        .digest('hex')}"`;

      res.setHeader('ETag', etag);

      // Check if client has fresh version
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      return originalJson(body);
    };

    return handler(req, res, next);
  };
}
```

## Why This Matters

- **Server Load Reduction**:
  - Without caching: 1000 requests/min = 1000 database queries
  - With 1-hour cache: 1000 requests/min = ~17 database queries
  - 98% reduction in server load
- **Performance**:
  - Server round trip: 200-500ms
  - Browser cache hit: <1ms
  - 200-500x faster response
- **Bandwidth Savings**:
  - 304 Not Modified responses: ~200 bytes
  - Full JSON response: 10-100KB
  - 50-500x bandwidth reduction
- **CDN Benefits**: `public` + `max-age` enables CDN caching, serving content from edge locations
- **Cache Strategies**:
  - **Immutable static assets**: `max-age=31536000, immutable` (1 year)
  - **Public content**: `public, max-age=3600` (1 hour)
  - **Private user data**: `private, max-age=300` (5 min)
  - **Real-time data**: `public, max-age=60, must-revalidate` (1 min)
  - **Sensitive data**: `no-store, no-cache` (never cache)
- **ETag Benefits**:
  - Enables conditional requests (If-None-Match)
  - Prevents serving stale content
  - Saves bandwidth even when content changes
- **Best Practices**:
  - Use ETags for dynamic content
  - Use versioned URLs for static assets (`/static/app.v123.js`)
  - Set `Vary` header when response varies by header
  - Use `private` for user-specific content
  - Use `s-maxage` for different CDN cache times
# perf-compression

Enable gzip or brotli compression middleware to reduce response payload sizes by 70-90%, dramatically improving response times especially for clients on slow networks.

## ❌ WRONG

```typescript
// BAD: No compression - sending raw JSON responses
import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/posts', async (req, res) => {
  const posts = await db.query.posts.findMany({
    with: { author: true, comments: true },
  });

  // Sending uncompressed 500KB JSON response
  res.json({ posts });
});

app.listen(3000);
```

## ✅ CORRECT

```typescript
// GOOD: Enable compression for all responses
import express from 'express';
import compression from 'compression';

const app = express();

// Enable compression middleware (gzip/deflate)
app.use(compression({
  level: 6,              // Compression level (0-9, 6 is default balance)
  threshold: 1024,       // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },
}));

app.use(express.json());

app.get('/api/posts', async (req, res) => {
  const posts = await db.query.posts.findMany({
    with: { author: true, comments: true },
  });

  // Response automatically compressed (500KB → 75KB)
  res.json({ posts });
});

app.listen(3000);

// BETTER: Use brotli for even better compression (Node.js 12+)
import { createBrotliCompress } from 'zlib';
import expressCompression from 'express-compression';

app.use(expressCompression({
  brotli: {
    enabled: true,
    zlib: createBrotliCompress,
  },
}));
```

## Why This Matters

- **Bandwidth Reduction**:
  - JSON responses typically compress 70-90%
  - 500KB response → 50-75KB compressed
  - Massive savings for repeated API calls
- **Response Time**:
  - Uncompressed 500KB on 3G: ~3000ms transfer
  - Compressed 75KB on 3G: ~450ms transfer
  - 85% faster for mobile users
- **Compression Comparison**:
  - **gzip**: 70-80% reduction, fast compression, universal support
  - **brotli**: 80-90% reduction, slower compression but better ratio, modern browser support
  - **deflate**: Older, less effective
- **CPU vs Network Trade-off**:
  - Compression CPU cost: ~5-20ms per request
  - Network savings: 500-2500ms on slow connections
  - Almost always worth it
- **Best Practices**:
  - Only compress responses > 1KB (threshold)
  - Don't compress images/video (already compressed)
  - Use level 6 (default) for balance
  - Level 9 = 2% better compression, 3x slower
- **Caching**: Compressed responses can be cached at CDN/proxy level
- **Headers**: Middleware handles `Content-Encoding` and `Vary` headers automatically
# perf-connection-pooling

Configure database connection pooling properly to reuse connections instead of creating new ones for every request, reducing connection overhead and improving throughput.

## ❌ WRONG

```typescript
// BAD: Creating new connection for every request
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function getUserById(id: string) {
  // Creates new connection every time
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
  });

  await client.end(); // Closes connection
  return user;
}
```

## ✅ CORRECT

```typescript
// GOOD: Configure connection pool once, reuse across requests
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection pool once (singleton pattern)
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,                    // Maximum pool size
  idle_timeout: 20,           // Close idle connections after 20s
  connect_timeout: 10,        // Connection timeout in seconds
  max_lifetime: 60 * 30,      // Recycle connections after 30 minutes
});

export const db = drizzle(client, { schema });

// Use the pooled connection in services
export async function getUserById(id: string) {
  // Reuses connection from pool
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
  });

  return user;
  // Connection automatically returned to pool
}

// Graceful shutdown
export async function closeDatabase() {
  await client.end();
}
```

## Why This Matters

- **Performance**: Creating new connections costs 20-100ms each; pooling reduces this to <1ms
- **Throughput**: Without pooling, max concurrent requests = max DB connections; with pooling, handle 1000s of requests with 10 connections
- **Resource Usage**: Each PostgreSQL connection uses ~10MB RAM; pooling prevents connection exhaustion
- **Benchmarks**:
  - No pooling: ~50 req/sec with high latency spikes
  - With pooling (10 connections): ~500 req/sec with consistent low latency
- **Production**: Connection limits are real - Heroku Postgres allows 20 connections on basic tier
- **Configuration**: Tune `max` based on `(core_count * 2) + effective_spindle_count` and available connections
# perf-database-indexes

Add database indexes on columns frequently used in WHERE clauses, JOIN conditions, and ORDER BY statements to speed up queries from seconds to milliseconds.

## ❌ WRONG

```typescript
// BAD: No indexes on columns used for filtering
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postsTable = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull(), // Foreign key, no index
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // Filtered often, no index
  createdAt: timestamp('created_at').defaultNow(), // Sorted often, no index
});

// Slow query: Full table scan on postsTable
export async function getPublishedPostsByAuthor(authorId: string) {
  // Without indexes, this scans ALL posts
  return await db.query.posts.findMany({
    where: (posts, { eq, and }) =>
      and(
        eq(posts.authorId, authorId),
        eq(posts.status, 'published')
      ),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });
}
```

## ✅ CORRECT

```typescript
// GOOD: Add indexes for common query patterns
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(), // Unique index for lookups
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}));

export const postsTable = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Composite index for common query pattern
  authorStatusIdx: index('posts_author_status_idx')
    .on(table.authorId, table.status),
  // Index for sorting
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
  // Index for status filtering
  statusIdx: index('posts_status_idx').on(table.status),
}));

// Fast query: Uses indexes
export async function getPublishedPostsByAuthor(authorId: string) {
  // Uses posts_author_status_idx and posts_created_at_idx
  return await db.query.posts.findMany({
    where: (posts, { eq, and }) =>
      and(
        eq(posts.authorId, authorId),
        eq(posts.status, 'published')
      ),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });
}

// Migration file example
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createIndex('posts_author_status_idx')
    .on('posts')
    .columns(['author_id', 'status'])
    .execute();
}
```

## Why This Matters

- **Query Speed**: Indexes turn O(n) scans into O(log n) lookups
  - Without index: 1M rows = ~2000ms full table scan
  - With index: 1M rows = ~5ms indexed lookup
  - 400x performance improvement
- **Composite Indexes**: Order matters - `(authorId, status)` works for both `WHERE authorId` and `WHERE authorId AND status`
- **Index Strategy**:
  - Primary keys: Automatically indexed
  - Foreign keys: Always index for JOIN performance
  - Unique constraints: Create unique indexes
  - Filter columns: Index high-cardinality columns used in WHERE
  - Sort columns: Index columns in ORDER BY
- **Trade-offs**:
  - Indexes speed up reads but slow down writes (INSERT/UPDATE)
  - Each index adds storage overhead (~10-20% of table size)
  - Don't over-index; focus on actual query patterns
- **Monitoring**: Use `EXPLAIN ANALYZE` to verify index usage
- **Real Impact**: A single missing index can cause production outages when tables grow beyond test data size
# perf-n-plus-one

Avoid N+1 query problems by using Drizzle's query API with relations to fetch associated data in a single query instead of making separate queries in loops.

## ❌ WRONG

```typescript
// N+1 problem: 1 query for posts + N queries for authors
export async function getPostsWithAuthors() {
  const posts = await db.select().from(postsTable);

  // BAD: Separate query for each post's author
  const postsWithAuthors = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      author: await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, post.authorId))
        .limit(1)
    }))
  );

  return postsWithAuthors;
}
```

## ✅ CORRECT

```typescript
// Use Drizzle query API with relations for efficient joins
export async function getPostsWithAuthors() {
  const postsWithAuthors = await db.query.posts.findMany({
    with: {
      author: true, // Single query with JOIN
    },
  });

  return postsWithAuthors;
}

// Alternative: Use explicit joins
export async function getPostsWithAuthorsExplicit() {
  const postsWithAuthors = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      authorId: postsTable.authorId,
      authorName: usersTable.name,
      authorEmail: usersTable.email,
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id));

  return postsWithAuthors;
}
```

## Why This Matters

- **Performance Impact**: N+1 queries can cause 100+ database round trips instead of 1, increasing response time from ~50ms to 5000ms+
- **Database Load**: Each query has overhead; 100 small queries consume more resources than 1 optimized query
- **Scalability**: Problem compounds with data growth - 1000 posts = 1001 queries vs 1 query
- **Real-world Impact**: Common cause of production slowdowns, especially when data grows beyond test datasets
- **Detection**: Use database query logging to identify N+1 patterns during development
- **Drizzle Solutions**: Query API with `with` relations, explicit joins, or `db.$with()` CTEs all prevent N+1
# perf-pagination

Always paginate large result sets using limit/offset or cursor-based pagination to prevent loading thousands of rows into memory and causing timeouts or crashes.

## ❌ WRONG

```typescript
// BAD: Loading all records at once
export async function getAllPosts() {
  // Loads 100,000 posts into memory - causes OOM crashes
  const posts = await db.query.posts.findMany({
    with: { author: true },
  });

  return posts; // 50MB+ response
}

// BAD: Client-side pagination only
export async function getPostsClientPagination(req: Request, res: Response) {
  // Still loads all posts from database
  const allPosts = await db.select().from(postsTable);

  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  // Pagination happens in app, not database
  const paginatedPosts = allPosts.slice((page - 1) * limit, page * limit);

  res.json({ posts: paginatedPosts });
}
```

## ✅ CORRECT

```typescript
// GOOD: Offset-based pagination (simple, works for most cases)
export interface PaginationParams {
  page: number;
  limit: number;
}

export async function getPostsPaginated(params: PaginationParams) {
  const { page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  // Fetch only one page of results
  const posts = await db.query.posts.findMany({
    limit,
    offset,
    with: { author: true },
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });

  // Get total count for pagination metadata
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postsTable);

  return {
    posts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1,
    },
  };
}

// BETTER: Cursor-based pagination (for real-time feeds, better performance)
export interface CursorPaginationParams {
  cursor?: string; // Last seen post ID
  limit: number;
}

export async function getPostsCursorPaginated(params: CursorPaginationParams) {
  const { cursor, limit = 20 } = params;

  const posts = await db.query.posts.findMany({
    limit: limit + 1, // Fetch one extra to know if there's more
    where: cursor
      ? (posts, { lt }) => lt(posts.createdAt, new Date(cursor))
      : undefined,
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    with: { author: true },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;

  return {
    posts: items,
    pagination: {
      nextCursor: hasMore
        ? items[items.length - 1].createdAt.toISOString()
        : null,
      hasMore,
    },
  };
}

// GOOD: Express route with validation
import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getPostsHandler(req: Request, res: Response) {
  const params = paginationSchema.parse(req.query);
  const result = await getPostsPaginated(params);

  res.json(result);
}
```

## Why This Matters

- **Memory**: Loading 100K posts = 50MB+ in memory; paginated = 500KB max
- **Performance**:
  - All records: 5000ms query + 2000ms serialization
  - Paginated: 50ms query + 20ms serialization
  - 100x faster response time
- **Database**: LIMIT/OFFSET prevents full table scans
- **Offset vs Cursor**:
  - **Offset**: Simpler, allows jumping to pages, but slow for high offsets (OFFSET 10000 scans 10000 rows)
  - **Cursor**: Faster, consistent performance, works for real-time feeds, but can't jump to arbitrary pages
- **Best Practices**:
  - Default limit: 20-50 items
  - Max limit: 100 items (prevent abuse)
  - Always validate and sanitize pagination params
  - Include pagination metadata in response
  - Use cursor pagination for feeds/timelines
  - Use offset pagination for browsing/search
- **Indexing**: Pagination requires indexes on ORDER BY columns for performance
- **Total Count**: Counting large tables is expensive; consider omitting total on huge datasets or caching count
# perf-response-caching

Implement server-side caching (Redis, in-memory) for expensive operations like complex database queries or external API calls to avoid redundant computation.

## ❌ WRONG

```typescript
// BAD: Expensive query runs on every request
export async function getDashboardStats(req: Request, res: Response) {
  // Complex aggregation - takes 5 seconds
  const stats = await db
    .select({
      totalUsers: sql<number>`count(distinct ${usersTable.id})`,
      totalPosts: sql<number>`count(distinct ${postsTable.id})`,
      avgPostsPerUser: sql<number>`count(${postsTable.id})::float / nullif(count(distinct ${usersTable.id}), 0)`,
      topAuthors: sql<any>`json_agg(distinct jsonb_build_object('name', ${usersTable.name}, 'posts', count(${postsTable.id})))`,
    })
    .from(usersTable)
    .leftJoin(postsTable, eq(postsTable.authorId, usersTable.id));

  // Runs every time - 5 second response time
  res.json({ stats });
}

// BAD: External API call on every request
export async function getWeatherData(req: Request, res: Response) {
  // Third-party API call - costs money, takes 2 seconds
  const weather = await fetch('https://api.weather.com/data');
  const data = await weather.json();

  // No caching - expensive and slow
  res.json(data);
}
```

## ✅ CORRECT

```typescript
// GOOD: In-memory caching for simple cases
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,          // Default TTL: 5 minutes
  checkperiod: 60,      // Check for expired keys every 60s
  useClones: false,     // Performance optimization
});

export async function getDashboardStats(req: Request, res: Response) {
  const cacheKey = 'dashboard:stats';

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ stats: cached });
  }

  // Cache miss - compute stats
  const stats = await db
    .select({
      totalUsers: sql<number>`count(distinct ${usersTable.id})`,
      totalPosts: sql<number>`count(distinct ${postsTable.id})`,
      avgPostsPerUser: sql<number>`count(${postsTable.id})::float / nullif(count(distinct ${usersTable.id}), 0)`,
    })
    .from(usersTable)
    .leftJoin(postsTable, eq(postsTable.authorId, usersTable.id));

  // Store in cache
  cache.set(cacheKey, stats, 300); // Cache for 5 minutes

  res.setHeader('X-Cache', 'MISS');
  res.json({ stats });
}

// BETTER: Redis caching for distributed systems
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

export async function getUserProfile(req: Request, res: Response) {
  const { userId } = req.params;
  const cacheKey = `user:profile:${userId}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ user: JSON.parse(cached) });
  }

  // Cache miss - fetch from database
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    with: {
      posts: { limit: 10 },
      followers: { limit: 100 },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Cache for 10 minutes
  await redis.setEx(cacheKey, 600, JSON.stringify(user));

  res.setHeader('X-Cache', 'MISS');
  res.json({ user });
}

// BEST: Cache middleware with invalidation
interface CacheOptions {
  ttl: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if condition not met
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : `${req.method}:${req.originalUrl}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      // Cache the response
      redis.setEx(cacheKey, options.ttl, JSON.stringify(body))
        .catch(err => console.error('Cache write error:', err));

      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

// Usage with cache invalidation
app.get('/api/posts/:id',
  cacheMiddleware({
    ttl: 3600,
    keyGenerator: (req) => `post:${req.params.id}`,
  }),
  getPost
);

// Invalidate cache on update
export async function updatePost(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body;

  const updatedPost = await db
    .update(postsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(postsTable.id, id))
    .returning();

  // Invalidate cache
  await redis.del(`post:${id}`);
  await redis.del('posts:list'); // Invalidate list cache too

  res.json({ post: updatedPost[0] });
}

// ADVANCED: Cache warming and preloading
export async function warmCache() {
  console.log('Warming cache...');

  // Preload popular posts
  const popularPosts = await db.query.posts.findMany({
    where: (posts, { gte }) =>
      gte(posts.viewCount, 1000),
    limit: 100,
  });

  for (const post of popularPosts) {
    const cacheKey = `post:${post.id}`;
    await redis.setEx(cacheKey, 3600, JSON.stringify(post));
  }

  console.log(`Warmed cache with ${popularPosts.length} popular posts`);
}

// Run cache warming on startup
warmCache().catch(console.error);
```

## Why This Matters

- **Response Time**:
  - Without cache: 5000ms complex query
  - With cache: 5ms Redis lookup
  - 1000x faster response
- **Database Load**:
  - 1000 req/min without cache = 1000 complex queries
  - 1000 req/min with 5min cache = ~4 queries
  - 99.6% reduction in database load
- **Cost Savings**: Caching external APIs prevents redundant paid calls
- **Scalability**: In-memory cache works for single server; Redis required for multi-server deployments
- **Cache Strategies**:
  - **Cache-aside**: Check cache, if miss fetch and populate (most common)
  - **Write-through**: Update cache on every write
  - **Write-behind**: Async cache updates
  - **Refresh-ahead**: Proactively refresh before expiry
- **TTL Guidelines**:
  - Dashboard stats: 5-15 minutes
  - User profiles: 5-10 minutes
  - Public posts: 1-24 hours
  - Real-time data: 30-60 seconds
  - External APIs: Based on data freshness requirements
- **Invalidation Strategies**:
  - **Time-based**: Set TTL, let expire naturally
  - **Event-based**: Invalidate on updates/deletes
  - **Pattern-based**: Invalidate groups of keys (e.g., `del user:123:*`)
- **Cache Key Design**:
  - Include resource type and ID: `user:profile:123`
  - Include query params for filtered results: `posts:list:page:1:limit:20`
  - Use consistent naming convention
- **Monitoring**: Track cache hit rate (aim for >80% for effective caching)
# perf-select-specific

Always select only the specific columns you need instead of using `SELECT *` to reduce data transfer, memory usage, and processing time.

## ❌ WRONG

```typescript
// BAD: Selecting all columns when only need a few
export async function getUsersForList() {
  // Fetches id, email, password, name, bio, avatar, createdAt, updatedAt, etc.
  const users = await db.select().from(usersTable);

  // Only using 2 fields but transferred everything
  return users.map(user => ({
    id: user.id,
    name: user.name,
  }));
}

// BAD: Using query API without limiting fields
export async function getPostsForFeed() {
  const posts = await db.query.posts.findMany({
    with: {
      author: true, // Fetches ALL author fields
    },
  });

  return posts;
}
```

## ✅ CORRECT

```typescript
// GOOD: Select only required columns
export async function getUsersForList() {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
    })
    .from(usersTable);

  return users;
}

// GOOD: Specify columns in query API
export async function getPostsForFeed() {
  const posts = await db.query.posts.findMany({
    columns: {
      id: true,
      title: true,
      excerpt: true,
      createdAt: true,
    },
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return posts;
}

// GOOD: Explicit selection for complex queries
export async function getPostsWithCounts() {
  const posts = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      authorName: usersTable.name,
      commentCount: sql<number>`count(${commentsTable.id})`.as('comment_count'),
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
    .groupBy(postsTable.id, usersTable.name);

  return posts;
}
```

## Why This Matters

- **Data Transfer**: Selecting 3 fields instead of 15 reduces payload by 80%, saving bandwidth and transfer time
- **Memory**: Less data in memory means lower RAM usage and better GC performance
- **Parsing**: JSON serialization time scales with data size; smaller payloads = faster responses
- **Benchmarks**:
  - SELECT * for 1000 users (15 columns): ~450KB, 85ms
  - SELECT id, name for 1000 users: ~45KB, 12ms
  - 88% reduction in size, 86% reduction in time
- **Security**: Don't accidentally expose sensitive fields like passwords or tokens in responses
- **Network**: Especially important for mobile clients on slow connections
- **Database**: Smaller result sets reduce database I/O and buffer pool pressure
# perf-streaming

Use streaming responses for large datasets or file downloads to reduce memory usage and improve time-to-first-byte instead of buffering entire responses.

## ❌ WRONG

```typescript
// BAD: Loading entire file into memory
export async function downloadLargeFile(req: Request, res: Response) {
  const filePath = '/path/to/large-file.csv'; // 500MB file

  // Reads entire file into memory - causes OOM crash
  const fileContent = await fs.promises.readFile(filePath);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
  res.send(fileContent); // 500MB in memory
}

// BAD: Buffering all database results
export async function exportAllUsers(req: Request, res: Response) {
  // Loads 1M users into memory
  const users = await db.select().from(usersTable);

  // Convert to CSV in memory
  const csv = users.map(u => `${u.id},${u.name},${u.email}`).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.send(csv); // Huge string in memory
}
```

## ✅ CORRECT

```typescript
// GOOD: Stream file from disk
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

export async function downloadLargeFile(req: Request, res: Response) {
  const filePath = '/path/to/large-file.csv';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');

  // Stream file in chunks - constant memory usage
  const fileStream = createReadStream(filePath);

  await pipeline(fileStream, res);
  // Memory usage: ~64KB buffer vs 500MB
}

// GOOD: Stream database results as CSV
import { Transform } from 'stream';

export async function exportAllUsers(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

  // Write CSV header
  res.write('id,name,email\n');

  // Stream results in batches
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const users = await db
      .select()
      .from(usersTable)
      .limit(batchSize)
      .offset(offset);

    if (users.length === 0) break;

    // Write batch to stream
    for (const user of users) {
      res.write(`${user.id},${user.name},${user.email}\n`);
    }

    offset += batchSize;
  }

  res.end();
  // Memory usage: constant ~100KB vs 100MB+
}

// BETTER: Use streaming JSON for APIs
import { Readable } from 'stream';

export async function streamPosts(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');

  let isFirst = true;
  let offset = 0;
  const batchSize = 100;

  while (true) {
    const posts = await db.query.posts.findMany({
      limit: batchSize,
      offset,
    });

    if (posts.length === 0) break;

    for (const post of posts) {
      if (!isFirst) res.write(',');
      res.write(JSON.stringify(post));
      isFirst = false;
    }

    offset += batchSize;
  }

  res.write(']');
  res.end();
}

// BEST: Use Transform stream for complex processing
class CsvTransform extends Transform {
  private isFirst = true;

  _transform(chunk: any, encoding: string, callback: Function) {
    const csv = `${chunk.id},${chunk.name},${chunk.email}\n`;
    callback(null, csv);
  }
}

export async function exportUsersWithTransform(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

  const csvTransform = new CsvTransform();

  // Write header
  res.write('id,name,email\n');

  // Stream through transform
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const users = await db
      .select()
      .from(usersTable)
      .limit(batchSize)
      .offset(offset);

    if (users.length === 0) break;

    for (const user of users) {
      csvTransform.write(user);
    }

    offset += batchSize;
  }

  csvTransform.end();
  await pipeline(csvTransform, res);
}
```

## Why This Matters

- **Memory Usage**:
  - Buffered 500MB file: 500MB+ memory usage
  - Streamed 500MB file: ~64KB memory usage
  - 7800x reduction in memory
- **Time to First Byte (TTFB)**:
  - Buffered: Wait for entire response, then send (5000ms)
  - Streamed: Send first chunk immediately (50ms)
  - 100x faster perceived performance
- **Scalability**:
  - Buffered: 10 concurrent 500MB downloads = 5GB memory (crash)
  - Streamed: 10 concurrent downloads = 640KB memory
- **Use Cases**:
  - File downloads (PDFs, CSVs, images)
  - Database exports
  - Large JSON responses
  - Real-time data feeds
  - Log file access
- **Backpressure**: Streams automatically handle backpressure (slow clients)
- **Error Handling**: Stream errors should close connection, not try to send error JSON
- **Libraries**:
  - `csv-writer` for CSV streaming
  - `json-stream-stringify` for JSON streaming
  - `archiver` for zip file streaming

---

## Architecture Rules (MEDIUM Priority)

# arch-async-handler-wrapper

Wrap ALL async route handlers with asyncHandler to catch errors. Never use raw try-catch in routes.

## ❌ WRONG

```typescript
// features/users/routes/user.routes.ts

// WRONG: Unhandled promise rejection
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
  // If userService.findById throws, the app crashes!
});

// WRONG: Manual try-catch in every route
router.post('/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    // Error handling repeated in every route
    if (error instanceof UserAlreadyExistsError) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WRONG: Inconsistent error handling
router.put('/users/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    // Different error handling than other routes
    console.error(error);
    res.status(500).send('Error');
  }
});

// WRONG: Missing error handling entirely
router.delete('/users/:id', async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
  // Silently crashes on error
});
```

## ✅ CORRECT

```typescript
// middleware/async-handler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { userService } from '../services/user.service';

const router = Router();

// CORRECT: All async routes wrapped
router.get('/users/:id', asyncHandler(async (req, res) => {
  // No try-catch needed - asyncHandler catches errors
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));

router.post('/users', asyncHandler(async (req, res) => {
  // Clean route handler - errors automatically handled
  const user = await userService.createUser(req.validated.body);
  res.status(201).json({ success: true, data: user });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.updateUser(
    req.params.id,
    req.validated.body
  );
  res.json({ success: true, data: user });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
}));

// Multiple async operations
router.get('/users/:id/posts', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  const posts = await postService.findByUserId(user.id);
  res.json({ success: true, data: { user, posts } });
}));

export default router;

// middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';

/**
 * Global error handler - catches all errors passed via next()
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle operational errors (known errors)
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json({
    success: false,
    error: message
  });
};

// src/index.ts
import express from 'express';
import userRoutes from './features/users/routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(express.json());
app.use('/api/v1/users', userRoutes);

// Error handler must be LAST middleware
app.use(errorHandler);

export default app;
```

## Why This Matters

- **Crash Prevention**: Unhandled promise rejections crash Node.js process
- **DRY Principle**: Error handling logic centralized, not repeated in every route
- **Consistency**: All errors handled the same way
- **Cleaner Code**: Routes focus on happy path, not error handling
- **Maintainability**: Change error format once in error handler, affects all routes
- **Testing**: Easier to test - mock error handler, not try-catch in every route
- **Production Safety**: Errors logged and sanitized in one place

Common mistakes:
```typescript
// WRONG: Forgetting asyncHandler
router.get('/users', async (req, res) => { /* ... */ });

// CORRECT: Always wrap async handlers
router.get('/users', asyncHandler(async (req, res) => { /* ... */ }));

// WRONG: try-catch in route
router.post('/users', asyncHandler(async (req, res) => {
  try {
    // ...
  } catch (error) {
    // NO! asyncHandler + global error handler does this
  }
}));

// CORRECT: Let errors bubble up
router.post('/users', asyncHandler(async (req, res) => {
  // Just let service throw - asyncHandler + global handler catch it
  const user = await userService.createUser(req.validated.body);
  res.json({ success: true, data: user });
}));
```

Alternative implementation with generics:
```typescript
export const asyncHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<void>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

Reference: [Architecture Guidelines - Error Handling](../../../references/architecture.md#error-handling)
# arch-custom-error-classes

Create custom error classes for domain-specific errors. Each error class should carry HTTP status code and context.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts

export const userService = {
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    // WRONG: Generic Error with no context
    if (!user) {
      throw new Error('Not found');
    }

    return user;
  },

  async createUser(data: CreateUserInput): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    // WRONG: Generic Error, no HTTP status code
    if (existing) {
      throw new Error('User exists');
    }

    // WRONG: Throwing strings (bad practice)
    if (!data.password) {
      throw 'Password required';
    }

    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    // WRONG: No context about which user or why it failed
    const result = await db.delete(users).where(eq(users.id, id));

    if (result.length === 0) {
      throw new Error('Delete failed');
    }
  }
};

// Route has to guess HTTP status codes
router.get('/users/:id', asyncHandler(async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json(user);
  } catch (error) {
    // WRONG: Guessing what status code to use
    res.status(404).json({ error: error.message });
  }
}));
```

## ✅ CORRECT

```typescript
// middleware/error-handler.ts
/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// features/users/errors/user.errors.ts
import { AppError } from '@/middleware/error-handler';

/**
 * Thrown when user is not found by ID or email
 */
export class UserNotFoundError extends AppError {
  constructor(identifier: string) {
    super(`User with identifier '${identifier}' not found`, 404);
  }
}

/**
 * Thrown when attempting to create user with existing email
 */
export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, 409);
  }
}

/**
 * Thrown when user update validation fails
 */
export class InvalidUserUpdateError extends AppError {
  constructor(reason: string) {
    super(`Invalid user update: ${reason}`, 400);
  }
}

/**
 * Thrown when user tries to perform unauthorized action
 */
export class UnauthorizedUserActionError extends AppError {
  constructor(userId: string, action: string) {
    super(`User '${userId}' is not authorized to ${action}`, 403);
  }
}

// features/auth/errors/auth.errors.ts
import { AppError } from '@/middleware/error-handler';

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', 401);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Authentication token has expired', 401);
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super('Invalid authentication token', 401);
  }
}

// features/users/services/user.service.ts
import { UserNotFoundError, UserAlreadyExistsError } from '../errors/user.errors';
import type { User, CreateUserInput } from '../types/user.types';

export const userService = {
  // CORRECT: Throws specific error with context
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id); // Clear error with ID
    }

    return user;
  },

  async findByEmail(email: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      throw new UserNotFoundError(email); // Reusable error class
    }

    return user;
  },

  async createUser(data: CreateUserInput): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      throw new UserAlreadyExistsError(data.email); // Specific 409 error
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      ...data,
      password: hashedPassword
    }).returning();

    return user;
  },

  async deleteUser(id: string): Promise<void> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new UserNotFoundError(id); // Clear why delete failed
    }
  },

  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    // Validate business rules
    if (updates.email) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, updates.email)
      });

      if (existing && existing.id !== id) {
        throw new UserAlreadyExistsError(updates.email);
      }
    }

    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
};

// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { userService } from '../services/user.service';

const router = Router();

// CORRECT: Clean routes - error classes carry status codes
router.get('/users/:id', asyncHandler(async (req, res) => {
  // No error handling needed - global middleware handles it
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));

router.post('/users', asyncHandler(async (req, res) => {
  // UserAlreadyExistsError automatically returns 409
  const user = await userService.createUser(req.validated.body);
  res.status(201).json({ success: true, data: user });
}));

export default router;

// middleware/error-handler.ts (continued)
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err.stack
      })
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Generic 500 for unexpected errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
};
```

## Why This Matters

- **Type Safety**: Can catch specific error types with `instanceof`
- **HTTP Status Codes**: Each error carries correct status code
- **Context**: Error messages include relevant IDs, emails, etc.
- **Consistency**: All 404 errors look the same, all 409 errors look the same
- **Debugging**: Stack traces and error names help identify source
- **Self-Documenting**: Error class name explains what went wrong
- **Client Experience**: Consistent error responses across API
- **Monitoring**: Can track error types in logs/monitoring tools

Error naming conventions:
- Suffix with `Error`: `UserNotFoundError`, not `UserNotFound`
- Be specific: `InvalidCredentialsError` not `AuthError`
- Include context: `EmailAlreadyTakenError` not `ConflictError`
- Use domain language: `OrderCancelledError` not `OperationError`

Common HTTP status codes:
```typescript
// 400 - Bad Request (client error)
export class InvalidInputError extends AppError {
  constructor(field: string) {
    super(`Invalid input for field: ${field}`, 400);
  }
}

// 401 - Unauthorized (authentication required)
export class UnauthenticatedError extends AppError {
  constructor() {
    super('Authentication required', 401);
  }
}

// 403 - Forbidden (authenticated but not allowed)
export class ForbiddenError extends AppError {
  constructor(action: string) {
    super(`Not authorized to perform: ${action}`, 403);
  }
}

// 404 - Not Found
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 404);
  }
}

// 409 - Conflict
export class ResourceConflictError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, 409);
  }
}

// 422 - Unprocessable Entity (validation failed)
export class ValidationError extends AppError {
  constructor(message: string) {
    super(`Validation failed: ${message}`, 422);
  }
}
```

Reference: [Architecture Guidelines - Error Handling](../../../references/architecture.md#error-handling)
# arch-explicit-return-types

ALL functions and methods MUST have explicit return types. Never rely on type inference for function returns.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts

export const userService = {
  // WRONG: No return type
  async findById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  },

  // WRONG: No return type
  async listUsers(page: number) {
    const users = await db.query.users.findMany({
      limit: 10,
      offset: (page - 1) * 10
    });
    return users;
  },

  // WRONG: No return type on helper function
  formatUser(user) {
    return {
      id: user.id,
      email: user.email
    };
  }
};

// features/auth/services/auth.service.ts
export const authService = {
  // WRONG: Return type not explicit
  async login(email: string, password: string) {
    const user = await userService.findByEmail(email);
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return { user, token: generateToken(user.id) };
  }
};

// Inline functions without return types
const processData = (data: User) => {
  return data.email.toLowerCase();
};
```

## ✅ CORRECT

```typescript
// features/users/types/user.types.ts
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
}

export interface FormattedUser {
  id: string;
  email: string;
}

// features/users/services/user.service.ts
import type { User, UserListResponse, FormattedUser } from '../types/user.types';

export const userService = {
  // CORRECT: Explicit return type
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  },

  // CORRECT: Explicit complex return type
  async listUsers(page: number): Promise<UserListResponse> {
    const users = await db.query.users.findMany({
      limit: 10,
      offset: (page - 1) * 10
    });

    const total = await db.select({ count: count() }).from(users);

    return {
      users,
      total: total[0].count,
      page
    };
  },

  // CORRECT: Explicit return type on helpers
  formatUser(user: User): FormattedUser {
    return {
      id: user.id,
      email: user.email
    };
  },

  // CORRECT: Void return type when nothing returned
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
};

// features/auth/types/auth.types.ts
export interface LoginResponse {
  user: User;
  token: string;
}

// features/auth/services/auth.service.ts
import type { LoginResponse } from '../types/auth.types';

export const authService = {
  // CORRECT: Explicit return type with interface
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await userService.findByEmail(email);
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return {
      user,
      token: generateToken(user.id)
    };
  }
};

// CORRECT: Inline functions with return types
const processData = (data: User): string => {
  return data.email.toLowerCase();
};

// CORRECT: Array and Promise return types
async function getUserEmails(userIds: string[]): Promise<string[]> {
  const users = await db.query.users.findMany({
    where: inArray(users.id, userIds)
  });
  return users.map(u => u.email);
}

// CORRECT: Union return types
function findUserOrGuest(id: string | null): Promise<User | GuestUser> {
  if (!id) {
    return Promise.resolve(createGuestUser());
  }
  return userService.findById(id);
}
```

## Why This Matters

- **Documentation**: Return types serve as inline documentation
- **Refactoring Safety**: Changes to implementation are caught if return type changes
- **Type Checking**: Ensures function actually returns what it claims to
- **IntelliSense**: Better IDE autocomplete for function consumers
- **Contract Enforcement**: Return type is a contract the function must fulfill
- **Error Prevention**: Catches accidental returns of wrong type
- **Consistency**: Makes codebase predictable and easier to navigate

Return type guidelines:
- Always specify return type for functions and methods
- For async functions, wrap in `Promise<T>`
- Use `void` when function returns nothing
- Create interfaces/types for complex return objects
- For arrays, specify element type: `User[]` or `Array<User>`
- For nullable returns, use union: `User | null`
- For generic utilities, use type parameters: `Promise<T>`

ESLint configuration to enforce:
```json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error"
  }
}
```

Reference: [Architecture Guidelines - Type Rules](../../../references/architecture.md#typescript-conventions)
# arch-no-any-types

NEVER use `any` type. Use proper TypeScript types, interfaces, or `unknown` for truly dynamic data.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts

// WRONG: Using any types
export const userService = {
  async createUser(data: any): Promise<any> { // WRONG!
    const user = await db.insert(users).values(data).returning();
    return user;
  },

  async updateUser(id: string, updates: any): Promise<any> { // WRONG!
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  },

  async processData(payload: any): Promise<void> { // WRONG!
    // No type safety at all
    console.log(payload.someField); // Might not exist
  }
};

// features/users/routes/user.routes.ts
router.post('/users', async (req: any, res: any) => { // WRONG!
  const data: any = req.body; // WRONG!
  const user = await userService.createUser(data);
  res.json(user);
});

// Type assertions without proper types
function transform(data: any): any { // WRONG!
  return data as User; // Unsafe cast
}
```

## ✅ CORRECT

```typescript
// features/users/types/user.types.ts
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
}

// features/users/services/user.service.ts
import type { User, CreateUserInput, UpdateUserInput } from '../types/user.types';

export const userService = {
  // CORRECT: Explicit input and return types
  async createUser(data: CreateUserInput): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  // CORRECT: Typed partial updates
  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  },

  // CORRECT: Use unknown for truly dynamic data, then validate
  async processWebhook(payload: unknown): Promise<void> {
    // Validate unknown data with Zod
    const validated = webhookSchema.parse(payload);

    // Now we have type safety
    console.log(validated.userId);
  }
};

// features/users/routes/user.routes.ts
import { Request, Response } from 'express';
import type { CreateUserInput } from '../types/user.types';

// CORRECT: Properly typed route handler
router.post('/users', asyncHandler(async (req: Request, res: Response) => {
  // req.validated has been validated by middleware
  const data: CreateUserInput = req.validated.body;
  const user = await userService.createUser(data);
  res.status(201).json({ success: true, data: user });
}));

// CORRECT: Type guards for dynamic data
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

function processData(data: unknown): User {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data; // Now safely typed as User
}

// CORRECT: Generics for reusable utilities
function paginate<T>(items: T[], page: number, limit: number): T[] {
  return items.slice((page - 1) * limit, page * limit);
}
```

## Why This Matters

- **Type Safety**: Compiler catches errors at build time, not runtime
- **IntelliSense**: IDEs provide autocomplete and inline documentation
- **Refactoring**: Safe renames and changes across codebase
- **Self-Documentation**: Types document expected data structures
- **Bug Prevention**: Many bugs are impossible when types are correct
- **Maintainability**: Easier to understand code without reading implementation

When you think you need `any`:

1. **For user input**: Use Zod validation + type inference
2. **For dynamic data**: Use `unknown` then validate with type guards
3. **For flexible functions**: Use generics `<T>`
4. **For partial types**: Use TypeScript utilities (`Partial<User>`, `Pick<User, 'id'>`)
5. **For third-party libraries**: Write proper type definitions or use `@types/*`

Enable strict TypeScript settings in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

Reference: [Architecture Guidelines - TypeScript Conventions](../../../references/architecture.md#typescript-conventions)
# arch-no-business-in-routes

Route handlers must be thin HTTP adapters. ALL business logic belongs in service layer.

## ❌ WRONG

```typescript
// features/users/routes/user.routes.ts
router.post('/users', async (req, res) => {
  // Business logic in route handler - WRONG!
  const { email, password } = req.body;

  // Checking business rules
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Password hashing logic
  const hashedPassword = await bcrypt.hash(password, 10);

  // More business logic
  const user = await db.insert(users).values({
    email,
    password: hashedPassword,
    createdAt: new Date()
  }).returning();

  res.status(201).json({ success: true, data: user });
});
```

## ✅ CORRECT

```typescript
// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { validate } from '@/middleware/validation.middleware';
import { createUserSchema } from '../validators/user.validators';
import { userService } from '../services/user.service';

const router = Router();

router.post(
  '/users',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    // Route is thin - only HTTP concerns
    const user = await userService.createUser(req.validated.body);
    res.status(201).json({ success: true, data: user });
  })
);

export default router;

// features/users/services/user.service.ts
import { db } from '@/config/database';
import { users } from '../schemas/user.schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { UserAlreadyExistsError } from '../errors/user.errors';

export const userService = {
  async createUser(data: { email: string; password: string }): Promise<User> {
    // All business logic is in the service
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      throw new UserAlreadyExistsError(data.email);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      createdAt: new Date()
    }).returning();

    return user;
  }
};
```

## Why This Matters

- **Testability**: Services can be unit tested without HTTP mocking
- **Reusability**: Same business logic can be called from multiple routes, CLI commands, or background jobs
- **Separation of Concerns**: Routes handle HTTP protocol, services handle domain logic
- **Maintainability**: Business rules are centralized, not scattered across route handlers
- **Single Responsibility**: Each layer has one reason to change

Routes should only:
1. Extract data from request
2. Call validation middleware
3. Invoke service methods
4. Format HTTP responses
5. Handle HTTP-specific concerns (headers, status codes)

Reference: [Architecture Guidelines - Routes Layer](../../../references/architecture.md#routes-layer)
# arch-no-db-in-routes

Routes MUST NOT access the database directly. All database operations belong in the service layer.

## ❌ WRONG

```typescript
// features/posts/routes/post.routes.ts
import { db } from '@/config/database';
import { posts } from '../schemas/post.schema';
import { eq } from 'drizzle-orm';

router.get('/posts/:id', async (req, res) => {
  // Direct database access from route - WRONG!
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, req.params.id),
    with: {
      author: true,
      comments: true
    }
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json({ success: true, data: post });
});

router.delete('/posts/:id', async (req, res) => {
  // More direct database access - WRONG!
  await db.delete(posts).where(eq(posts.id, req.params.id));
  res.status(204).send();
});
```

## ✅ CORRECT

```typescript
// features/posts/routes/post.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { postService } from '../services/post.service';

const router = Router();

router.get('/posts/:id', asyncHandler(async (req, res) => {
  // Route delegates to service
  const post = await postService.findById(req.params.id);
  res.json({ success: true, data: post });
}));

router.delete('/posts/:id', asyncHandler(async (req, res) => {
  // Route delegates to service
  await postService.deleteById(req.params.id);
  res.status(204).send();
}));

export default router;

// features/posts/services/post.service.ts
import { db } from '@/config/database';
import { posts } from '../schemas/post.schema';
import { eq } from 'drizzle-orm';
import { PostNotFoundError } from '../errors/post.errors';
import type { Post } from '../types/post.types';

export const postService = {
  async findById(id: string): Promise<Post> {
    // Database access is encapsulated in service
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        comments: true
      }
    });

    if (!post) {
      throw new PostNotFoundError(id);
    }

    return post;
  },

  async deleteById(id: string): Promise<void> {
    // All database operations in service layer
    const result = await db.delete(posts)
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      throw new PostNotFoundError(id);
    }
  }
};
```

## Why This Matters

- **Layer Separation**: Routes handle HTTP, services handle data access
- **Testability**: Database operations can be mocked at service boundary
- **Error Handling**: Services throw typed errors, routes convert to HTTP responses
- **Transaction Management**: Services can coordinate multi-table operations with transactions
- **Query Optimization**: Database logic is centralized and easier to optimize
- **Reusability**: Same database operations available to multiple routes or consumers
- **Security**: Database access patterns are controlled and auditable in one place

Routes must NEVER:
- Import `db` from database config
- Import schema definitions for queries
- Use Drizzle query builder
- Perform any database operations

Reference: [Architecture Guidelines - Rules](../../../references/architecture.md#layering--responsibilities)
# arch-services-throw-errors

Services MUST throw errors, never return error objects. Use typed error classes with HTTP status codes.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts
export const userService = {
  // WRONG: Returning error objects
  async findById(id: string): Promise<User | { error: string }> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      return { error: 'User not found' }; // WRONG!
    }

    return user;
  },

  // WRONG: Returning null/undefined for errors
  async createUser(data: CreateUserInput): Promise<User | null> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      return null; // WRONG! Lost error context
    }

    return user;
  }
};

// Route has to handle error objects
router.get('/users/:id', async (req, res) => {
  const result = await userService.findById(req.params.id);

  // Ugly error checking in route
  if ('error' in result) {
    return res.status(404).json(result);
  }

  res.json({ success: true, data: result });
});
```

## ✅ CORRECT

```typescript
// features/users/errors/user.errors.ts
import { AppError } from '@/middleware/error-handler';

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`, 404);
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 409);
    this.name = 'UserAlreadyExistsError';
  }
}

// features/users/services/user.service.ts
import { UserNotFoundError, UserAlreadyExistsError } from '../errors/user.errors';
import type { User, CreateUserInput } from '../types/user.types';

export const userService = {
  // CORRECT: Throws typed errors
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id); // Clean error throw
    }

    return user; // Type is always User, never error
  },

  // CORRECT: Throws on error conditions
  async createUser(data: CreateUserInput): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      throw new UserAlreadyExistsError(data.email);
    }

    const [user] = await db.insert(users).values(data).returning();
    return user;
  }
};

// features/users/routes/user.routes.ts
import { asyncHandler } from '@/middleware/async-handler';

// Route is clean - asyncHandler catches errors
router.get('/users/:id', asyncHandler(async (req, res) => {
  // No error checking needed
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));

// middleware/error-handler.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler converts errors to HTTP responses
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

## Why This Matters

- **Type Safety**: Return types are clean - `Promise<User>` not `Promise<User | ErrorObject>`
- **Centralized Error Handling**: Global middleware converts errors to HTTP responses
- **Better DX**: No need to check for error objects in every caller
- **Stack Traces**: Thrown errors preserve call stack for debugging
- **Error Context**: Custom error classes carry status codes and additional context
- **Consistency**: All services handle errors the same way
- **Cleaner Routes**: Route handlers don't need error checking logic

Service error guidelines:
- Always throw for error conditions
- Use typed error classes extending `AppError`
- Include context in error messages (IDs, emails, etc.)
- Set appropriate HTTP status codes in error class
- Never return `null`, `undefined`, or error objects for failures

Reference: [Architecture Guidelines - Error Handling](../../../references/architecture.md#error-handling)
# arch-type-inference-zod

Use Zod for validation AND type inference. Never duplicate types - infer TypeScript types from Zod schemas.

## ❌ WRONG

```typescript
// features/users/types/user.types.ts
// WRONG: Duplicating type definitions
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  age: number;
}

// features/users/validators/user.validators.ts
import { z } from 'zod';

// WRONG: Redefining the same structure in Zod
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    age: z.number().int().min(18)
  })
});

// Now you have to maintain both definitions!
// If you add a field, you must update both places

// features/users/services/user.service.ts
import type { CreateUserInput } from '../types/user.types';

export const userService = {
  // Using the manually defined type
  async createUser(data: CreateUserInput): Promise<User> {
    // ...
  }
};
```

## ✅ CORRECT

```typescript
// features/users/validators/user.validators.ts
import { z } from 'zod';

// CORRECT: Single source of truth - Zod schema
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(8).max(72),
    name: z.string().min(1).max(100).trim(),
    age: z.number().int().min(18).max(120)
  })
});

// CORRECT: Infer TypeScript type from Zod schema
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];

// Additional schemas with inference
export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase().optional(),
    name: z.string().min(1).max(100).trim().optional(),
    age: z.number().int().min(18).max(120).optional()
  })
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string()
  })
});

export type LoginInput = z.infer<typeof loginSchema>['body'];

// features/users/services/user.service.ts
import type { CreateUserInput, UpdateUserInput } from '../validators/user.validators';

export const userService = {
  // CORRECT: Using inferred types
  async createUser(data: CreateUserInput): Promise<User> {
    // Type safety guaranteed - data matches validation
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      age: data.age,
      createdAt: new Date()
    }).returning();

    return user;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    // Type ensures only valid fields can be updated
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
};

// Complex nested schemas with inference
export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    tags: z.array(z.string()).max(10).optional(),
    metadata: z.object({
      featured: z.boolean().default(false),
      scheduledAt: z.string().datetime().optional()
    }).optional()
  })
});

export type CreatePostInput = z.infer<typeof createPostSchema>['body'];

// Discriminated unions with Zod
export const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user.created'),
    userId: z.string().uuid(),
    email: z.string().email()
  }),
  z.object({
    type: z.literal('user.deleted'),
    userId: z.string().uuid()
  })
]);

export type Event = z.infer<typeof eventSchema>;
// Type is: { type: 'user.created', userId: string, email: string }
//        | { type: 'user.deleted', userId: string }
```

## Why This Matters

- **Single Source of Truth**: Schema is the only definition, no duplication
- **DRY Principle**: Define structure once, get validation + types
- **Consistency**: Types always match validation, impossible to drift
- **Refactoring**: Change schema once, types update automatically
- **Runtime Safety**: Validation happens at runtime, types enforced at compile time
- **Rich Validation**: Zod provides validation that TypeScript can't (email format, string length, etc.)
- **Less Code**: No need to maintain separate type definitions
- **Type Safety**: Inferred types are guaranteed to match validation

Zod inference patterns:
```typescript
// Basic inference
const schema = z.object({ name: z.string() });
type Type = z.infer<typeof schema>;
// Type is: { name: string }

// Nested schema
const schema = z.object({ body: z.object({ id: z.string() }) });
type Type = z.infer<typeof schema>['body'];
// Type is: { id: string }

// Array inference
const schema = z.array(z.string());
type Type = z.infer<typeof schema>;
// Type is: string[]

// Optional fields
const schema = z.object({
  required: z.string(),
  optional: z.string().optional()
});
type Type = z.infer<typeof schema>;
// Type is: { required: string; optional?: string | undefined }

// Default values
const schema = z.object({
  value: z.boolean().default(false)
});
type Type = z.infer<typeof schema>;
// Type is: { value?: boolean | undefined }
// After .parse(), value will be boolean (default applied)
```

Best practices:
1. Define Zod schemas first, types second via inference
2. Keep schemas in `validators/` folder
3. Export both schema and inferred type
4. Use `z.infer<typeof schema>` for type extraction
5. Add runtime transforms in Zod (trim, toLowerCase, etc.)
6. Use discriminated unions for polymorphic data

Reference: [Architecture Guidelines - Validation Strategy](../../../references/architecture.md#validation-strategy)

---

## Code Quality Rules (LOW Priority)

# quality-barrel-exports

Use index.ts barrel files to create clean public APIs for features while keeping internal implementation details private.

## ❌ WRONG

```typescript
// app.ts - Importing individual files directly
import { getUserById } from './features/users/user.controller';
import { createUser } from './features/users/user.service';
import { userSchema } from './features/users/user.schema';
import type { User } from './features/users/user.types';

// Problem: Consumers need to know internal file structure
// No control over what's public vs private
// Refactoring internals breaks imports everywhere
```

```typescript
// features/users/index.ts - Exporting everything (too permissive)
export * from './user.controller';
export * from './user.service';
export * from './user.schema';
export * from './user.types';

// Problem: Exposes internal implementation details
// Makes it hard to refactor without breaking consumers
```

## ✅ CORRECT

```typescript
// features/users/index.ts - Explicit, curated barrel exports
// Export only the public API of this feature

// Routes (always exported - this is the entry point)
export { userRouter } from './user.routes';

// Schemas (exported for request validation)
export {
  createUserSchema,
  updateUserSchema,
  userParamsSchema
} from './user.schema';

// Types (exported for type checking in other features)
export type {
  User,
  CreateUserDTO,
  UpdateUserDTO
} from './user.types';

// Services (exported ONLY if used by other features)
export { UserService } from './user.service';

// NOT exported (internal implementation details):
// - user.controller.ts functions (only used by routes)
// - Internal helper functions
// - Private types
// - Database query builders
```

**Usage Example**:

```typescript
// app.ts - Clean imports from feature barrel
import { userRouter } from './features/users';
import { orderRouter } from './features/orders';
import { paymentRouter } from './features/payments';

app.use('/users', userRouter);
app.use('/orders', orderRouter);
app.use('/payments', paymentRouter);
```

```typescript
// features/orders/order.service.ts - Cross-feature import
import { UserService } from '../users';
import type { User } from '../users';

export async function createOrderForUser(userId: string) {
  // Can use exported service and type
  const user = await UserService.findById(userId);
  // Cannot access user.controller functions (not exported)
}
```

**Advanced Pattern - Separate Internal/External Exports**:

```typescript
// features/users/index.ts - Public API
export { userRouter } from './user.routes';
export type { User } from './user.types';

// features/users/internal.ts - For testing or same-feature use
export { getUserById, createUser } from './user.controller';
export { hashPassword, validateEmail } from './user.helpers';
```

## Why This Matters

- **Encapsulation**: Hide implementation details, expose only public API
- **Refactoring Safety**: Change internal structure without breaking consumers
- **Clear Boundaries**: Explicit exports document what's meant to be public
- **Prevents Tight Coupling**: Other features can't reach into internal files
- **Better IntelliSense**: IDE autocomplete shows only intended public exports
- **Documentation**: Barrel file acts as a contract for the feature
- **Import Organization**: One import path per feature vs multiple file imports

**When to Export**:
- ✅ Routes (always - this is the feature entry point)
- ✅ Validation schemas (needed for request validation)
- ✅ Types/Interfaces (needed for type checking across features)
- ✅ Service classes (only if used by other features)
- ❌ Controller functions (internal to routes)
- ❌ Helper/utility functions (unless shared across features)
- ❌ Internal constants (unless part of public API)

**Reference**: This pattern supports the feature-based architecture in `apps/api/.claude/references/architecture.md`.
# quality-feature-structure

Organize features into self-contained directories with consistent file structure: routes, controllers, services, schemas, and types.

## ❌ WRONG

```
apps/api/src/
├── controllers/
│   ├── user.controller.ts
│   ├── order.controller.ts
│   └── payment.controller.ts
├── services/
│   ├── user.service.ts
│   ├── order.service.ts
│   └── payment.service.ts
├── routes/
│   ├── user.routes.ts
│   ├── order.routes.ts
│   └── payment.routes.ts
├── schemas/
│   ├── user.schema.ts
│   ├── order.schema.ts
│   └── payment.schema.ts
└── types/
    ├── user.types.ts
    ├── order.types.ts
    └── payment.types.ts

// Problem: Feature code scattered across multiple directories
// Finding all user-related code requires navigating 5+ directories
// Imports become lengthy: ../../../services/user.service
// Hard to understand feature boundaries
```

## ✅ CORRECT

```
apps/api/src/features/
├── users/
│   ├── user.routes.ts       // Route definitions
│   ├── user.controller.ts   // Request handlers
│   ├── user.service.ts      // Business logic
│   ├── user.schema.ts       // Zod validation schemas
│   ├── user.types.ts        // TypeScript types
│   └── index.ts             // Barrel export
├── orders/
│   ├── order.routes.ts
│   ├── order.controller.ts
│   ├── order.service.ts
│   ├── order.schema.ts
│   ├── order.types.ts
│   └── index.ts
└── payments/
    ├── payment.routes.ts
    ├── payment.controller.ts
    ├── payment.service.ts
    ├── payment.schema.ts
    ├── payment.types.ts
    └── index.ts

// Benefits:
// - All user code in one directory
// - Short imports: ./user.service
// - Clear feature boundaries
// - Easy to move features or create microservices
```

**Example Feature Structure**:

```typescript
// features/users/index.ts - Barrel export
export { userRouter } from './user.routes';
export { UserService } from './user.service';
export { userSchema, updateUserSchema } from './user.schema';
export type { User, CreateUserDTO, UpdateUserDTO } from './user.types';

// app.ts - Clean feature imports
import { userRouter } from './features/users';
import { orderRouter } from './features/orders';
import { paymentRouter } from './features/payments';

app.use('/users', userRouter);
app.use('/orders', orderRouter);
app.use('/payments', paymentRouter);
```

## Why This Matters

- **Feature Isolation**: Each feature is self-contained and independently understandable
- **Easier Navigation**: Developers can find all related code in one directory
- **Better Imports**: Relative imports within feature are short (./user.service vs ../../../services/user.service)
- **Microservices Ready**: Features can be extracted to separate services easily
- **Team Collaboration**: Multiple developers can work on different features without conflicts
- **Testing**: Feature tests can be colocated in the same directory
- **Onboarding**: New developers can understand one feature at a time

**File Naming Convention**:
- `feature.routes.ts` - Express router with endpoint definitions
- `feature.controller.ts` - Request handlers (thin layer)
- `feature.service.ts` - Business logic and database operations
- `feature.schema.ts` - Zod validation schemas
- `feature.types.ts` - TypeScript interfaces and types
- `index.ts` - Barrel export for public API

**Reference**: See `apps/api/.claude/references/architecture.md` for detailed feature-based architecture patterns.
# quality-import-order

Maintain consistent import organization by grouping external dependencies, internal modules, and types in a predictable order.

## ❌ WRONG

```typescript
// user.controller.ts - Chaotic import order
import { userSchema } from './schemas';
import type { Request, Response } from 'express';
import { findUserById } from './user.service';
import { z } from 'zod';
import { asyncHandler } from '../../../middleware/async-handler';
import type { User } from './types';
import express from 'express';
```

## ✅ CORRECT

```typescript
// user.controller.ts - Organized import order
// 1. External dependencies
import express from 'express';
import { z } from 'zod';

// 2. Express types
import type { Request, Response } from 'express';

// 3. Shared middleware/utilities
import { asyncHandler } from '../../../middleware/async-handler';

// 4. Feature-specific imports (services, schemas, types)
import { findUserById } from './user.service';
import { userSchema } from './schemas';
import type { User } from './types';
```

## Why This Matters

- **Readability**: Organized imports make dependencies immediately clear
- **Maintenance**: Easier to identify circular dependencies and missing imports
- **Consistency**: Teams can quickly navigate any file when structure is predictable
- **Code Review**: Changes to dependencies are easier to spot in diffs
- **IDE Performance**: Some tools perform better with organized imports

**Reference**: Many teams use ESLint's `import/order` rule to enforce this automatically.
# quality-naming-conventions

Use consistent naming conventions across your codebase: camelCase for variables/functions, PascalCase for classes/types, UPPER_CASE for constants.

## ❌ WRONG

```typescript
// Inconsistent naming conventions
import type { Request, Response } from 'express';

// Constants not in UPPER_CASE
const max_retries = 3;
const default_timeout = 5000;

// Class not in PascalCase
class validationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Function using snake_case
export async function get_user_profile(req: Request, res: Response) {
  const User_ID = req.params.id; // Variable in PascalCase

  // Service method inconsistent
  const userData = await UserService.Find_By_ID(User_ID);

  res.json(userData);
}
```

## ✅ CORRECT

```typescript
// Consistent naming conventions
import type { Request, Response } from 'express';

// Constants in UPPER_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// Class in PascalCase
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Functions and variables in camelCase
export async function getUserProfile(req: Request, res: Response) {
  const userId = req.params.id;

  // Service method in camelCase
  const userData = await UserService.findById(userId);

  res.json(userData);
}

// Type/Interface in PascalCase
interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}
```

## Why This Matters

- **TypeScript Conventions**: Aligns with official TypeScript and JavaScript community standards
- **Visual Parsing**: Different casing helps developers instantly recognize constants vs variables
- **Team Consistency**: New developers can follow established patterns without documentation
- **Tooling Support**: Linters and formatters expect these conventions
- **Cross-Language Compatibility**: Matches conventions in most modern languages

**Reference**: [TypeScript Coding Guidelines](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)
# quality-no-magic-values

Replace hardcoded values with named constants to improve readability, maintainability, and prevent errors.

## ❌ WRONG

```typescript
// user.service.ts - Magic values everywhere
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function createUser(email: string, password: string) {
  // What is 10? Why 10?
  const hashedPassword = await bcrypt.hash(password, 10);

  // Magic timeout value
  const result = await Promise.race([
    db.insert(users).values({ email, password: hashedPassword }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ]);

  return result;
}

export async function findRecentUsers() {
  // What does 30 represent? Days? Minutes?
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // What is 100? Max users? Page size?
  return db.select().from(users).limit(100);
}

// HTTP status codes as magic numbers
export function validateAge(age: number) {
  if (age < 18) {
    throw { status: 400, message: 'Too young' };
  }
  if (age > 120) {
    throw { status: 422, message: 'Invalid age' };
  }
}
```

## ✅ CORRECT

```typescript
// user.service.ts - Named constants
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Configuration constants at the top
const BCRYPT_SALT_ROUNDS = 10;
const DB_OPERATION_TIMEOUT_MS = 5000;
const RECENT_USERS_DAYS = 30;
const DEFAULT_PAGE_SIZE = 100;
const MIN_USER_AGE = 18;
const MAX_REALISTIC_AGE = 120;

// HTTP status codes
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNPROCESSABLE_ENTITY: 422,
} as const;

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const result = await Promise.race([
    db.insert(users).values({ email, password: hashedPassword }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), DB_OPERATION_TIMEOUT_MS)
    )
  ]);

  return result;
}

export async function findRecentUsers() {
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - (RECENT_USERS_DAYS * millisecondsInDay));

  return db.select().from(users).limit(DEFAULT_PAGE_SIZE);
}

export function validateAge(age: number) {
  if (age < MIN_USER_AGE) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `User must be at least ${MIN_USER_AGE} years old`
    };
  }
  if (age > MAX_REALISTIC_AGE) {
    throw {
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: `Age cannot exceed ${MAX_REALISTIC_AGE}`
    };
  }
}
```

## Why This Matters

- **Self-Documenting**: Constants explain what values mean without comments
- **Single Source of Truth**: Change a value in one place, not scattered across files
- **Type Safety**: `as const` provides literal type inference for constants
- **Easier Testing**: Constants can be mocked or adjusted for tests
- **Business Logic Clarity**: Validation rules become explicit and searchable
- **Prevent Typos**: Using `HTTP_STATUS.BAD_REQUEST` vs remembering "400"

**Common Magic Values to Replace**:
- HTTP status codes (use named constants or enums)
- Timeout durations
- Pagination limits
- Bcrypt salt rounds
- Date/time calculations
- Validation thresholds
