import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { env } from '../config/env';
import { AppError } from '../common/utils/errors';

// Redis client for distributed rate limiting (optional)
const redis = env.REDIS_URL ? new Redis(env.REDIS_URL) : undefined;

/**
 * Create rate limiter with optional Redis store for distributed systems
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
          // @ts-expect-error - Type mismatch between ioredis and rate-limit-redis
          client: redis,
          prefix: 'rate-limit:',
        })
      : undefined,

    skipSuccessfulRequests: options.skipSuccessfulRequests,
    skipFailedRequests: options.skipFailedRequests,

    // Customize error response
    handler: (_req, _res) => {
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
      // @ts-expect-error - user is added by authenticate middleware
      return req.user?.id || req.ip;
    },

    store: redis
      ? new RedisStore({
          // @ts-expect-error - Type mismatch between ioredis and rate-limit-redis
          client: redis,
          prefix: 'rate-limit:user:',
        })
      : undefined,

    handler: (_req, _res) => {
      throw new AppError(options.message || 'Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    },
  });
};
