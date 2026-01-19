import { z } from 'zod';
import dotenv from 'dotenv';

// Skip dotenv in tests - test setup handles environment variables
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('time2ship'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Email configuration
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_SECURE: z.string().default('false'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@time2ship.com'),
  EMAIL_FROM_NAME: z.string().default('Time2Ship'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  // Redis configuration (optional - for distributed rate limiting)
  REDIS_URL: z.string().url().optional(),

  // Sentry configuration (optional - for error monitoring)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
