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
