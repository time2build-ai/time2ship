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
