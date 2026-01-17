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
