/**
 * CORRECT.TS - Example code following Express best practices
 *
 * This file demonstrates CORRECT patterns that follow security, performance,
 * architecture, and code quality rules for production-ready Express/TypeScript APIs.
 *
 * Compare with violations.ts to understand the differences.
 */

// ✅ CORRECT: quality-import-order - Proper import organization
// External dependencies first
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';
import { createReadStream } from 'fs';

// Internal dependencies
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// ✅ CORRECT: sec-secrets-env - Loading secrets from environment
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

// ✅ CORRECT: arch-no-any-types - Proper type definitions
// ✅ CORRECT: arch-explicit-return-types - Explicit return types
interface CreateUserInput {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

// ✅ CORRECT: arch-custom-error-classes - Custom error classes
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ CORRECT: sec-input-validation-zod - Zod validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['user', 'admin'])
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// ✅ CORRECT: quality-no-magic-values - Constants instead of magic values
const BCRYPT_ROUNDS = 12;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CACHE_TTL = 60 * 60; // 1 hour

// ✅ CORRECT: arch-async-handler-wrapper - Async error handling wrapper
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ✅ CORRECT: sec-authorize-middleware - Authorization middleware
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// ✅ CORRECT: arch-services-throw-errors - Service layer with proper error handling
class UserService {
  // ✅ CORRECT: arch-explicit-return-types
  async createUser(input: CreateUserInput): Promise<User> {
    // ✅ CORRECT: sec-auth-password-hashing - Bcrypt hashing
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // ✅ CORRECT: sec-sql-injection-drizzle - Parameterized queries with Drizzle
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        role: input.role
      })
      .returning();

    return user;
  }

  // ✅ CORRECT: perf-n-plus-one - Using JOIN to avoid N+1
  // ✅ CORRECT: perf-select-specific - Selecting specific columns
  // ✅ CORRECT: perf-pagination - Implementing pagination
  async getUsers(page: number, limit: number): Promise<User[]> {
    const offset = (page - 1) * limit;

    const usersWithPosts = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .limit(limit)
      .offset(offset);

    return usersWithPosts;
  }

  async authenticate(email: string, password: string): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // ✅ CORRECT: sec-auth-password-hashing - Bcrypt comparison
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    return user;
  }
}

const userService = new UserService();

// ✅ CORRECT: arch-no-business-in-routes - Thin routes, business logic in services
// ✅ CORRECT: arch-no-db-in-routes - No direct database access
// ✅ CORRECT: sec-input-validation-zod - Request validation
// ✅ CORRECT: sec-error-leakage - Sanitized error responses
export const createUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = createUserSchema.parse(req.body);

    const user = await userService.createUser(validatedData);

    // Don't expose password hash
    const { passwordHash, ...safeUser } = user;

    res.status(201).json(safeUser);
  }
);

// ✅ CORRECT: perf-pagination - Paginated responses
// ✅ CORRECT: perf-cache-headers - Caching headers for GET requests
export const getUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = paginationSchema.parse(req.query);

    const users = await userService.getUsers(page, limit);

    // ✅ CORRECT: perf-cache-headers - Set cache headers
    res.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
    res.json({
      data: users,
      pagination: { page, limit }
    });
  }
);

// ✅ CORRECT: sec-path-traversal - Path validation and sanitization
// ✅ CORRECT: sec-authorize-middleware - Authorization required
export const getFile = [
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { filename } = req.params;

    // ✅ CORRECT: sec-path-traversal - Validate filename
    if (!/^[a-zA-Z0-9-_]+\.[a-z]+$/.test(filename)) {
      throw new ValidationError('Invalid filename');
    }

    // Construct safe path
    const safePath = path.join(__dirname, 'uploads', path.basename(filename));

    // Verify path is within uploads directory
    if (!safePath.startsWith(path.join(__dirname, 'uploads'))) {
      throw new ValidationError('Invalid file path');
    }

    res.sendFile(safePath);
  })
];

// ✅ CORRECT: perf-avoid-blocking - Using async operations
// ✅ CORRECT: arch-async-handler-wrapper - Proper error handling
export const processData = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data } = req.body;

    // Offload to worker thread or queue for CPU-intensive work
    const result = await processInBackground(data);

    res.json({ result });
  }
);

// Helper function for background processing
async function processInBackground(data: any): Promise<number> {
  // Use worker threads or job queue for CPU-intensive tasks
  return new Promise((resolve) => {
    setImmediate(() => {
      let result = 0;
      for (let i = 0; i < 1000000000; i++) {
        result += Math.sqrt(i);
      }
      resolve(result);
    });
  });
}

// ✅ CORRECT: sec-xss-prevention - Using template engine with auto-escaping
import { renderTemplate as safeRender } from '../utils/template';

export const renderTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name } = req.query;

    // Template engine handles escaping automatically
    const html = safeRender('greeting', { name });

    res.send(html);
  }
);

// ✅ CORRECT: sec-rate-limiting - Rate limiting on auth endpoints
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

// ✅ CORRECT: sec-auth-token-expiry - Token with expiration
// ✅ CORRECT: sec-auth-jwt-secret - Secret from environment
export const login = [
  loginLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await userService.authenticate(email, password);

    // ✅ CORRECT: sec-auth-token-expiry - Set token expiration
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({ token, expiresIn: JWT_EXPIRY });
  })
];

// ✅ CORRECT: perf-connection-pooling - Using connection pool (configured in db.ts)
// ✅ CORRECT: arch-services-throw-errors - Using service layer
export const updateProfile = [
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { bio } = req.body;
    const userId = req.user!.userId;

    // Service layer handles database interaction
    await userService.updateProfile(userId, bio);

    res.json({ success: true });
  })
];

// ✅ CORRECT: sec-cors-config - Restrictive CORS configuration
export const corsOptions = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
});

// ✅ CORRECT: perf-compression - Using compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
});

// ✅ CORRECT: perf-streaming - Streaming large files
export const downloadLargeFile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filePath = './large-file.zip';

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="large-file.zip"'
    });

    // ✅ CORRECT: perf-streaming - Stream instead of loading into memory
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
);

// ✅ CORRECT: quality-feature-structure - Feature-based organization
// This file would be in: src/features/users/users.routes.ts
// With: users.service.ts, users.validators.ts, users.schemas.ts

// ✅ CORRECT: quality-barrel-exports - Barrel exports
export * from './users.routes';
export * from './users.service';
export * from './users.validators';

// ✅ CORRECT: quality-naming-conventions - Clear, descriptive names
export const getUserById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id, 10);
    const user = await userService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  }
);

// ✅ CORRECT: perf-database-indexes - Ensure indexes exist in schema
// In db/schema.ts:
// export const users = pgTable('users', {
//   id: serial('id').primaryKey(),
//   email: varchar('email', { length: 255 }).notNull().unique(),
//   passwordHash: text('password_hash').notNull(),
//   role: varchar('role', { length: 50 }).notNull(),
//   createdAt: timestamp('created_at').defaultNow().notNull(),
// }, (table) => ({
//   emailIdx: index('email_idx').on(table.email),
//   roleIdx: index('role_idx').on(table.role),
// }));

// ✅ CORRECT: perf-response-caching - Implement response caching for expensive queries
import { cache } from '../utils/cache';

export const getExpensiveData = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cacheKey = 'expensive-data';

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Fetch and cache
    const data = await performExpensiveQuery();
    await cache.set(cacheKey, data, CACHE_TTL);

    res.json(data);
  }
);

async function performExpensiveQuery(): Promise<any> {
  // Complex database query
  return {};
}
