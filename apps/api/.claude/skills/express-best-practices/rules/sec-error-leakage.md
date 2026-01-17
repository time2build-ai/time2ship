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
