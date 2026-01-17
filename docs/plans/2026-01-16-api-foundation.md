# API Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete API foundation with users and auth features following feature-based architecture.

**Architecture:** Feature-based vertical slices with layered internals (routes → services → database). PostgreSQL + Drizzle ORM for persistence, JWT for authentication, Zod for validation, Jest for testing.

**Tech Stack:** Express, TypeScript, Drizzle ORM, PostgreSQL, Zod, bcrypt, jsonwebtoken, Jest

---

## Prerequisites

**Install dependencies first:**

```bash
cd apps/api
npm install drizzle-orm pg zod bcrypt jsonwebtoken
npm install -D drizzle-kit @types/pg @types/bcrypt @types/jsonwebtoken jest ts-jest @types/jest supertest @types/supertest
```

**Update tsconfig.json to add path aliases:**

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

---

## Task 1: Setup Project Infrastructure

**Files:**
- Modify: `apps/api/tsconfig.json`
- Create: `apps/api/.env.example`
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/jest.config.js`

### Step 1: Update tsconfig.json with path aliases

```typescript
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    },
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 2: Create .env.example

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time2ship
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secrets (CHANGE IN PRODUCTION - generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-32-character-secret-change-me-in-production
JWT_REFRESH_SECRET=another-32-character-secret-change-me-too
```

### Step 3: Create drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/features/**/schemas/*.schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'time2ship',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
} satisfies Config;
```

### Step 4: Create jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Step 5: Update package.json scripts

Add these scripts to `apps/api/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx drizzle/seed.ts"
  }
}
```

### Step 6: Commit infrastructure setup

```bash
git add tsconfig.json .env.example drizzle.config.ts jest.config.js package.json
git commit -m "chore: setup project infrastructure with Drizzle, Jest, and path aliases"
```

---

## Task 2: Create Common Utilities

**Files:**
- Create: `apps/api/src/common/utils/errors.ts`
- Create: `apps/api/src/common/constants/index.ts`
- Create: `apps/api/src/common/helpers/index.ts`

### Step 1: Create error classes

Create `apps/api/src/common/utils/errors.ts`:

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
```

### Step 2: Create constants file

Create `apps/api/src/common/constants/index.ts`:

```typescript
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;

export const BCRYPT_ROUNDS = 10;
```

### Step 3: Create helpers file (placeholder)

Create `apps/api/src/common/helpers/index.ts`:

```typescript
// Placeholder for future helper functions
export {};
```

### Step 4: Commit common utilities

```bash
git add src/common/
git commit -m "feat: add common error classes and constants"
```

---

## Task 3: Environment Configuration

**Files:**
- Create: `apps/api/src/config/env.ts`

### Step 1: Write test for environment validation

Create `apps/api/src/config/__tests__/env.test.ts`:

```typescript
import { z } from 'zod';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-chars';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
    process.env.DB_PASSWORD = 'testpassword';

    const envSchema = z.object({
      JWT_ACCESS_SECRET: z.string().min(32),
      JWT_REFRESH_SECRET: z.string().min(32),
      DB_PASSWORD: z.string(),
    });

    expect(() => envSchema.parse(process.env)).not.toThrow();
  });

  it('should throw error for short JWT secrets', () => {
    process.env.JWT_ACCESS_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'short';

    const envSchema = z.object({
      JWT_ACCESS_SECRET: z.string().min(32),
      JWT_REFRESH_SECRET: z.string().min(32),
    });

    expect(() => envSchema.parse(process.env)).toThrow();
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- env.test.ts
```

Expected: FAIL - env.ts does not exist

### Step 3: Create environment validation

Create `apps/api/src/config/env.ts`:

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('time2ship'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

### Step 4: Run test to verify it passes

```bash
npm test -- env.test.ts
```

Expected: PASS

### Step 5: Commit environment configuration

```bash
git add src/config/env.ts src/config/__tests__/env.test.ts
git commit -m "feat: add environment variable validation with Zod"
```

---

## Task 4: Database Configuration

**Files:**
- Create: `apps/api/src/config/database.ts`

### Step 1: Create database connection

Create `apps/api/src/config/database.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';

const pool = new Pool({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

export const db = drizzle(pool);
```

### Step 2: Commit database configuration

```bash
git add src/config/database.ts
git commit -m "feat: add database connection with Drizzle ORM"
```

---

## Task 5: Validation Middleware

**Files:**
- Create: `apps/api/src/middleware/validate.ts`
- Create: `apps/api/src/middleware/__tests__/validate.test.ts`

### Step 1: Write test for validation middleware

Create `apps/api/src/middleware/__tests__/validate.test.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate';
import { AppError } from '@/common/utils/errors';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should attach validated data to request', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    mockRequest.body = { email: 'test@example.com' };

    const middleware = validate(schema);
    middleware(mockRequest as any, mockResponse as Response, nextFunction);

    expect((mockRequest as any).validated).toBeDefined();
    expect((mockRequest as any).validated.body.email).toBe('test@example.com');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next with error for invalid data', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    mockRequest.body = { email: 'invalid-email' };

    const middleware = validate(schema);
    middleware(mockRequest as any, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- validate.test.ts
```

Expected: FAIL - validate middleware does not exist

### Step 3: Create validation middleware

Create `apps/api/src/middleware/validate.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/common/utils/errors';

export interface ValidatedRequest extends Request {
  validated: {
    body?: any;
    params?: any;
    query?: any;
  };
}

export const validate = (schema: ZodSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.validated = validated;
      next();
    } catch (error: any) {
      if (error.errors) {
        const messages = error.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        next(new AppError(messages, 400));
      } else {
        next(error);
      }
    }
  };
};
```

### Step 4: Run test to verify it passes

```bash
npm test -- validate.test.ts
```

Expected: PASS

### Step 5: Commit validation middleware

```bash
git add src/middleware/validate.ts src/middleware/__tests__/validate.test.ts
git commit -m "feat: add Zod validation middleware"
```

---

## Task 6: Update Error Handler

**Files:**
- Modify: `apps/api/src/middleware/errorHandler.ts`

### Step 1: Update error handler to use common errors

Replace content of `apps/api/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error('Unexpected error:', err);

  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(500).json({
    success: false,
    message,
  });
};
```

### Step 2: Commit error handler update

```bash
git add src/middleware/errorHandler.ts
git commit -m "refactor: update error handler to use common AppError"
```

---

## Task 7: Users Database Schema

**Files:**
- Create: `apps/api/src/features/users/schemas/user.schema.ts`

### Step 1: Create user schema

Create `apps/api/src/features/users/schemas/user.schema.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Step 2: Update database config to include schema

Modify `apps/api/src/config/database.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as userSchema from '@/features/users/schemas/user.schema';

const pool = new Pool({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

export const db = drizzle(pool, {
  schema: { ...userSchema },
});
```

### Step 3: Commit user schema

```bash
git add src/features/users/schemas/user.schema.ts src/config/database.ts
git commit -m "feat: add users database schema with Drizzle"
```

---

## Task 8: User Validators

**Files:**
- Create: `apps/api/src/features/users/validators/user.validators.ts`
- Create: `apps/api/src/features/users/validators/__tests__/user.validators.test.ts`

### Step 1: Write test for user validators

Create `apps/api/src/features/users/validators/__tests__/user.validators.test.ts`:

```typescript
import { createUserSchema, updateUserSchema } from '../user.validators';

describe('User Validators', () => {
  describe('createUserSchema', () => {
    it('should validate correct user data', () => {
      const validData = {
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      };

      expect(() => createUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        body: {
          email: 'invalid-email',
          password: 'Password123!',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password (no uppercase)', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: 'password123!',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password (no special char)', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: 'Password123',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: 'Pass1!',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        body: {
          email: 'newemail@example.com',
        },
        params: {
          id: '123e4567-e89b-12d3-a456-426614174000',
        },
      };

      expect(() => updateUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID in params', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
        },
        params: {
          id: 'invalid-uuid',
        },
      };

      expect(() => updateUserSchema.parse(invalidData)).toThrow();
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- user.validators.test.ts
```

Expected: FAIL - validators do not exist

### Step 3: Create user validators

Create `apps/api/src/features/users/validators/user.validators.ts`:

```typescript
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    password: passwordSchema.optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});
```

### Step 4: Run test to verify it passes

```bash
npm test -- user.validators.test.ts
```

Expected: PASS

### Step 5: Commit user validators

```bash
git add src/features/users/validators/
git commit -m "feat: add user validators with comprehensive password rules"
```

---

## Task 9: User Service

**Files:**
- Create: `apps/api/src/features/users/services/user.service.ts`
- Create: `apps/api/src/features/users/services/__tests__/user.service.test.ts`

### Step 1: Write test for user service

Create `apps/api/src/features/users/services/__tests__/user.service.test.ts`:

```typescript
import { UserService } from '../user.service';
import { db } from '@/config/database';
import { users } from '../../schemas/user.schema';
import { AppError } from '@/common/utils/errors';
import bcrypt from 'bcrypt';

jest.mock('@/config/database');
jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);
      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashed_password');
      (db.insert as jest.Mock) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await userService.create('test@example.com', 'Password123!');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    });

    it('should throw AppError when user already exists', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      await expect(
        userService.create('test@example.com', 'Password123!')
      ).rejects.toThrow(AppError);
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.findById('123');

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('123');
    });

    it('should throw AppError when user not found', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(userService.findById('999')).rejects.toThrow(AppError);
    });
  });

  describe('findByEmail', () => {
    it('should return user with password for auth', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.findByEmail('test@example.com');

      expect(result).toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw AppError when user not found', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(userService.findByEmail('notfound@example.com')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('update', () => {
    it('should update user email', async () => {
      const existingUser = {
        id: '123',
        email: 'old@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        email: 'new@example.com',
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.update('123', { email: 'new@example.com' });

      expect(result.email).toBe('new@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should update user password', async () => {
      const existingUser = {
        id: '123',
        email: 'test@example.com',
        password: 'old_hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('new_hash');
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              { ...existingUser, password: 'new_hash' },
            ]),
          }),
        }),
      });

      await userService.update('123', { password: 'NewPassword123!' });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const existingUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(userService.delete('123')).resolves.not.toThrow();
    });

    it('should throw AppError when user not found', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(userService.delete('999')).rejects.toThrow(AppError);
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- user.service.test.ts
```

Expected: FAIL - user service does not exist

### Step 3: Create user service

Create `apps/api/src/features/users/services/user.service.ts`:

```typescript
import { db } from '@/config/database';
import { users } from '../schemas/user.schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { AppError } from '@/common/utils/errors';
import { BCRYPT_ROUNDS } from '@/common/constants';

export class UserService {
  async create(email: string, password: string): Promise<Omit<typeof users.$inferSelect, 'password'>> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
      })
      .returning();

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findById(id: string): Promise<Omit<typeof users.$inferSelect, 'password'>> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<typeof users.$inferSelect> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async update(
    id: string,
    data: { email?: string; password?: string }
  ): Promise<Omit<typeof users.$inferSelect, 'password'>> {
    await this.findById(id);

    const updates: any = { updatedAt: new Date() };
    if (data.email) updates.email = data.email;
    if (data.password) updates.password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await db.delete(users).where(eq(users.id, id));
  }
}

export const userService = new UserService();
```

### Step 4: Run test to verify it passes

```bash
npm test -- user.service.test.ts
```

Expected: PASS

### Step 5: Commit user service

```bash
git add src/features/users/services/
git commit -m "feat: add user service with CRUD operations and password hashing"
```

---

## Task 10: Refresh Token Schema

**Files:**
- Create: `apps/api/src/features/auth/schemas/refresh-token.schema.ts`

### Step 1: Create refresh token schema

Create `apps/api/src/features/auth/schemas/refresh-token.schema.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from '@/features/users/schemas/user.schema';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
```

### Step 2: Update database config to include refresh token schema

Modify `apps/api/src/config/database.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as userSchema from '@/features/users/schemas/user.schema';
import * as refreshTokenSchema from '@/features/auth/schemas/refresh-token.schema';

const pool = new Pool({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

export const db = drizzle(pool, {
  schema: { ...userSchema, ...refreshTokenSchema },
});
```

### Step 3: Commit refresh token schema

```bash
git add src/features/auth/schemas/refresh-token.schema.ts src/config/database.ts
git commit -m "feat: add refresh token database schema"
```

---

## Task 11: Token Service

**Files:**
- Create: `apps/api/src/features/auth/services/token.service.ts`
- Create: `apps/api/src/features/auth/services/__tests__/token.service.test.ts`

### Step 1: Write test for token service

Create `apps/api/src/features/auth/services/__tests__/token.service.test.ts`:

```typescript
import { TokenService } from '../token.service';
import { db } from '@/config/database';
import { AppError } from '@/common/utils/errors';
import jwt from 'jsonwebtoken';

jest.mock('@/config/database');
jest.mock('jsonwebtoken');

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
    tokenService = new TokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      (jwt.sign as jest.Mock) = jest.fn().mockReturnValue('access_token');

      const token = tokenService.generateAccessToken('user-123', 'test@example.com');

      expect(token).toBe('access_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', email: 'test@example.com' },
        'test-access-secret-32-characters-long',
        { expiresIn: '15m' }
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      (jwt.sign as jest.Mock) = jest.fn().mockReturnValue('refresh_token');

      const token = tokenService.generateRefreshToken('user-123');

      expect(token).toBe('refresh_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'test-refresh-secret-32-characters-long',
        { expiresIn: '7d' }
      );
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token in database', async () => {
      (db.insert as jest.Mock) = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await tokenService.storeRefreshToken('token-123', 'user-123');

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockToken = {
        token: 'valid-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 1000000),
        isRevoked: false,
      };

      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ userId: 'user-123' });
      (db.query.refreshTokens.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockToken);

      const userId = await tokenService.verifyRefreshToken('valid-token');

      expect(userId).toBe('user-123');
    });

    it('should throw error for invalid JWT', async () => {
      (jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(tokenService.verifyRefreshToken('invalid-token')).rejects.toThrow(
        AppError
      );
    });

    it('should throw error for revoked token', async () => {
      const mockToken = {
        token: 'revoked-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 1000000),
        isRevoked: true,
      };

      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ userId: 'user-123' });
      (db.query.refreshTokens.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockToken);

      await expect(tokenService.verifyRefreshToken('revoked-token')).rejects.toThrow(
        AppError
      );
    });

    it('should throw error for expired token', async () => {
      const mockToken = {
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000000),
        isRevoked: false,
      };

      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ userId: 'user-123' });
      (db.query.refreshTokens.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockToken);

      await expect(tokenService.verifyRefreshToken('expired-token')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token', async () => {
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await tokenService.revokeRefreshToken('token-123');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      (jwt.verify as jest.Mock) = jest
        .fn()
        .mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      const result = tokenService.verifyAccessToken('valid-token');

      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error for invalid access token', () => {
      (jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.verifyAccessToken('invalid-token')).toThrow(AppError);
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- token.service.test.ts
```

Expected: FAIL - token service does not exist

### Step 3: Create token service

Create `apps/api/src/features/auth/services/token.service.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { db } from '@/config/database';
import { refreshTokens } from '../schemas/refresh-token.schema';
import { eq } from 'drizzle-orm';
import { AppError } from '@/common/utils/errors';
import { env } from '@/config/env';
import { TOKEN_EXPIRY } from '@/common/constants';

export class TokenService {
  private readonly accessSecret = env.JWT_ACCESS_SECRET;
  private readonly refreshSecret = env.JWT_REFRESH_SECRET;

  generateAccessToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, this.accessSecret, {
      expiresIn: TOKEN_EXPIRY.ACCESS,
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshSecret, {
      expiresIn: TOKEN_EXPIRY.REFRESH,
    });
  }

  async storeRefreshToken(token: string, userId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(refreshTokens).values({
      token,
      userId,
      expiresAt,
    });
  }

  async verifyRefreshToken(token: string): Promise<string> {
    let decoded: any;
    try {
      decoded = jwt.verify(token, this.refreshSecret);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }

    const storedToken = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, token),
    });

    if (!storedToken) {
      throw new AppError('Refresh token not found', 401);
    }

    if (storedToken.isRevoked) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    if (new Date() > storedToken.expiresAt) {
      throw new AppError('Refresh token expired', 401);
    }

    return decoded.userId;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.token, token));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  verifyAccessToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, this.accessSecret) as { userId: string; email: string };
    } catch (error) {
      throw new AppError('Invalid or expired access token', 401);
    }
  }
}

export const tokenService = new TokenService();
```

### Step 4: Run test to verify it passes

```bash
npm test -- token.service.test.ts
```

Expected: PASS

### Step 5: Commit token service

```bash
git add src/features/auth/services/token.service.ts src/features/auth/services/__tests__/token.service.test.ts
git commit -m "feat: add token service with JWT generation and validation"
```

---

## Task 12: Auth Validators

**Files:**
- Create: `apps/api/src/features/auth/validators/auth.validators.ts`

### Step 1: Create auth validators

Create `apps/api/src/features/auth/validators/auth.validators.ts`:

```typescript
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
```

### Step 2: Commit auth validators

```bash
git add src/features/auth/validators/auth.validators.ts
git commit -m "feat: add auth validators for register, login, and token refresh"
```

---

## Task 13: Auth Service

**Files:**
- Create: `apps/api/src/features/auth/services/auth.service.ts`
- Create: `apps/api/src/features/auth/services/__tests__/auth.service.test.ts`

### Step 1: Write test for auth service

Create `apps/api/src/features/auth/services/__tests__/auth.service.test.ts`:

```typescript
import { AuthService } from '../auth.service';
import { userService } from '@/features/users/services/user.service';
import { tokenService } from './token.service';
import { AppError } from '@/common/utils/errors';
import bcrypt from 'bcrypt';

jest.mock('@/features/users/services/user.service');
jest.mock('../token.service');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register new user and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.create as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (tokenService.generateAccessToken as jest.Mock) = jest.fn().mockReturnValue('access_token');
      (tokenService.generateRefreshToken as jest.Mock) = jest.fn().mockReturnValue('refresh_token');
      (tokenService.storeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await authService.register('test@example.com', 'Password123!');

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(tokenService.storeRefreshToken).toHaveBeenCalledWith('refresh_token', 'user-123');
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.findByEmail as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);
      (tokenService.generateAccessToken as jest.Mock) = jest.fn().mockReturnValue('access_token');
      (tokenService.generateRefreshToken as jest.Mock) = jest.fn().mockReturnValue('refresh_token');
      (tokenService.storeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'Password123!');

      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.findByEmail as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'WrongPassword123!')
      ).rejects.toThrow(AppError);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockResolvedValue('user-123');
      (userService.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (tokenService.revokeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      (tokenService.generateAccessToken as jest.Mock) = jest.fn().mockReturnValue('new_access_token');
      (tokenService.generateRefreshToken as jest.Mock) = jest.fn().mockReturnValue('new_refresh_token');
      (tokenService.storeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await authService.refresh('old_refresh_token');

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('old_refresh_token');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      (tokenService.revokeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await authService.logout('refresh_token');

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh_token');
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- auth.service.test.ts
```

Expected: FAIL - auth service does not exist

### Step 3: Create auth service

Create `apps/api/src/features/auth/services/auth.service.ts`:

```typescript
import bcrypt from 'bcrypt';
import { userService } from '@/features/users/services/user.service';
import { tokenService } from './token.service';
import { AppError } from '@/common/utils/errors';

export class AuthService {
  async register(email: string, password: string) {
    const user = await userService.create(email, password);

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await tokenService.storeRefreshToken(refreshToken, user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await userService.findByEmail(email);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await tokenService.storeRefreshToken(refreshToken, user.id);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refresh(oldRefreshToken: string) {
    const userId = await tokenService.verifyRefreshToken(oldRefreshToken);

    const user = await userService.findById(userId);

    await tokenService.revokeRefreshToken(oldRefreshToken);

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await tokenService.storeRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }
}

export const authService = new AuthService();
```

### Step 4: Run test to verify it passes

```bash
npm test -- auth.service.test.ts
```

Expected: PASS

### Step 5: Commit auth service

```bash
git add src/features/auth/services/auth.service.ts src/features/auth/services/__tests__/auth.service.test.ts
git commit -m "feat: add auth service with register, login, refresh, and logout"
```

---

## Task 14: Authentication Middleware

**Files:**
- Create: `apps/api/src/features/auth/middleware/authenticate.ts`
- Create: `apps/api/src/features/auth/middleware/__tests__/authenticate.test.ts`

### Step 1: Write test for authentication middleware

Create `apps/api/src/features/auth/middleware/__tests__/authenticate.test.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../authenticate';
import { tokenService } from '../../services/token.service';
import { AppError } from '@/common/utils/errors';

jest.mock('../../services/token.service');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should attach user to request for valid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer valid_token',
    };

    (tokenService.verifyAccessToken as jest.Mock) = jest.fn().mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next with error when no authorization header', () => {
    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next with error for malformed authorization header', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat',
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next with error for invalid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid_token',
    };

    (tokenService.verifyAccessToken as jest.Mock) = jest.fn().mockImplementation(() => {
      throw new AppError('Invalid token', 401);
    });

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- authenticate.test.ts
```

Expected: FAIL - authenticate middleware does not exist

### Step 3: Create authentication middleware

Create `apps/api/src/features/auth/middleware/authenticate.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { AppError } from '@/common/utils/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    const decoded = tokenService.verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};
```

### Step 4: Run test to verify it passes

```bash
npm test -- authenticate.test.ts
```

Expected: PASS

### Step 5: Commit authentication middleware

```bash
git add src/features/auth/middleware/
git commit -m "feat: add authentication middleware for JWT verification"
```

---

## Task 15: User Routes

**Files:**
- Create: `apps/api/src/features/users/routes/user.routes.ts`
- Create: `apps/api/src/features/users/routes/index.ts`

### Step 1: Create user routes

Create `apps/api/src/features/users/routes/user.routes.ts`:

```typescript
import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authenticate, AuthRequest } from '@/features/auth/middleware/authenticate';
import { userService } from '../services/user.service';
import { getUserSchema, updateUserSchema } from '../validators/user.validators';

const router = Router();

router.use(authenticate);

router.get(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  })
);

router.put(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.update(req.params.id, req.validated.body);
    res.json({ success: true, data: user });
  })
);

router.delete(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    await userService.delete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  })
);

export default router;
```

### Step 2: Create user routes index

Create `apps/api/src/features/users/routes/index.ts`:

```typescript
import userRoutes from './user.routes';

export default userRoutes;
```

### Step 3: Commit user routes

```bash
git add src/features/users/routes/
git commit -m "feat: add user routes with authentication"
```

---

## Task 16: Auth Routes

**Files:**
- Create: `apps/api/src/features/auth/routes/auth.routes.ts`
- Create: `apps/api/src/features/auth/routes/index.ts`

### Step 1: Create auth routes

Create `apps/api/src/features/auth/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate, ValidatedRequest } from '@/middleware/validate';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: ValidatedRequest, res) => {
    const result = await authService.register(
      req.validated.body.email,
      req.validated.body.password
    );
    res.status(201).json({ success: true, data: result });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: ValidatedRequest, res) => {
    const result = await authService.login(
      req.validated.body.email,
      req.validated.body.password
    );
    res.json({ success: true, data: result });
  })
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: ValidatedRequest, res) => {
    const result = await authService.refresh(req.validated.body.refreshToken);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(async (req: ValidatedRequest, res) => {
    await authService.logout(req.validated.body.refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  })
);

export default router;
```

### Step 2: Create auth routes index

Create `apps/api/src/features/auth/routes/index.ts`:

```typescript
import authRoutes from './auth.routes';

export default authRoutes;
```

### Step 3: Commit auth routes

```bash
git add src/features/auth/routes/
git commit -m "feat: add auth routes for register, login, refresh, and logout"
```

---

## Task 17: Feature Router Registration

**Files:**
- Create: `apps/api/src/features/index.ts`

### Step 1: Create feature router

Create `apps/api/src/features/index.ts`:

```typescript
import { Router } from 'express';
import userRoutes from './users/routes';
import authRoutes from './auth/routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);

export default router;
```

### Step 2: Commit feature router

```bash
git add src/features/index.ts
git commit -m "feat: register user and auth feature routes"
```

---

## Task 18: Update Main Entry Point

**Files:**
- Modify: `apps/api/src/index.ts`

### Step 1: Update main entry point

Replace content of `apps/api/src/index.ts`:

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { env } from './config/env';
import featureRoutes from './features';

dotenv.config();

const app: Application = express();
const PORT = env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/v1', featureRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
  console.log(`👥 User endpoints: http://localhost:${PORT}/api/v1/users`);
});

export default app;
```

### Step 2: Commit entry point update

```bash
git add src/index.ts
git commit -m "feat: update entry point with versioned API routes"
```

---

## Task 19: Database Seed Script

**Files:**
- Create: `apps/api/drizzle/seed.ts`

### Step 1: Create seed script

Create `apps/api/drizzle/seed.ts`:

```typescript
import { db } from '../src/config/database';
import { users } from '../src/features/users/schemas/user.schema';
import bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../src/common/constants';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    const testUserPassword = await bcrypt.hash('Test1234!', BCRYPT_ROUNDS);
    const [testUser] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        password: testUserPassword,
      })
      .returning();

    console.log('✅ Test user created:', testUser.email);

    const adminPassword = await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS);
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@example.com',
        password: adminPassword,
      })
      .returning();

    console.log('✅ Admin user created:', adminUser.email);

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
```

### Step 2: Commit seed script

```bash
git add drizzle/seed.ts
git commit -m "feat: add database seed script with test users"
```

---

## Task 20: Create .env File

### Step 1: Copy .env.example to .env

```bash
cd apps/api
cp .env.example .env
```

### Step 2: Generate JWT secrets

```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env
```

### Step 3: Update .env with actual values

Manually edit `.env` to ensure all values are correct.

**Do NOT commit .env file** (it should be in .gitignore)

---

## Task 21: Run Migrations and Seeds

### Step 1: Generate migrations

```bash
npm run db:generate
```

Expected: Migration files created in `drizzle/migrations/`

### Step 2: Run migrations

```bash
npm run db:migrate
```

Expected: Database tables created

### Step 3: Run seed script

```bash
npm run db:seed
```

Expected: Test users created in database

### Step 4: Commit migrations

```bash
git add drizzle/migrations/
git commit -m "chore: add initial database migrations"
```

---

## Task 22: Integration Testing

### Step 1: Run all tests

```bash
npm test
```

Expected: All tests pass

### Step 2: Check test coverage

```bash
npm run test:coverage
```

Expected: Coverage meets thresholds (70%+)

### Step 3: Start development server

```bash
npm run dev
```

Expected: Server starts on port 3001

### Step 4: Manual API testing

Test the endpoints manually or with a tool like curl/Postman:

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Test1234!"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Get User (use access token from login)
curl -X GET http://localhost:3001/api/v1/users/{user-id} \
  -H "Authorization: Bearer {access-token}"
```

---

## Completion Checklist

- [ ] All dependencies installed
- [ ] tsconfig.json updated with path aliases
- [ ] Environment configuration with validation
- [ ] Database connection configured
- [ ] Common utilities (errors, constants) created
- [ ] Validation middleware implemented
- [ ] User schema and service created
- [ ] User validators and routes implemented
- [ ] Refresh token schema created
- [ ] Token service implemented
- [ ] Auth service implemented
- [ ] Auth validators and routes implemented
- [ ] Authentication middleware created
- [ ] Feature routes registered
- [ ] Main entry point updated
- [ ] Database migrations generated and run
- [ ] Seed script created and run
- [ ] All tests passing
- [ ] Test coverage meets thresholds
- [ ] API endpoints tested manually
- [ ] Documentation complete

---

## Final Commit

```bash
git add .
git commit -m "feat: complete API foundation with users and auth

- Feature-based architecture with layered internals
- PostgreSQL + Drizzle ORM
- JWT authentication with token rotation
- Comprehensive validation with Zod
- bcrypt password hashing
- Jest testing with 70%+ coverage
- Environment validation
- Database migrations and seeds

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

**Implementation complete!** The API foundation is ready with users and auth features demonstrating all architectural patterns.
