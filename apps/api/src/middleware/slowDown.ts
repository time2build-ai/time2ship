import slowDown from 'express-slow-down';
import { env } from '../config/env';

/**
 * Slow down repeated requests before hitting rate limit
 * Adds increasing delay to responses
 * Disabled in test environment
 */
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // Start slowing down after 3 requests
  delayMs: (hits) => hits * 500, // Add 500ms delay per request
  maxDelayMs: 5000, // Maximum 5 second delay
  skip: () => env.NODE_ENV === 'test', // Skip in test mode
});
