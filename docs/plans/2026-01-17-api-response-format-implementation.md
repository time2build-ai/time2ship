# API Response Format & Error Code Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement standardized response format with error codes, request IDs, and pagination support across the API boilerplate.

**Architecture:** Hybrid error code system (central + feature-specific), ResponseHelper utility for consistent responses, PaginationHelper for offset-based pagination, enhanced error classes with codes, request ID middleware for tracing.

**Tech Stack:** TypeScript, Express, Zod, UUID, Jest

---

## Phase 1: Foundation Layer

### Task 1: Central Error Codes

**Files:**
- Create: `src/common/constants/error-codes.ts`
- Modify: `src/common/constants/index.ts`

**Step 1: Create central error codes file**

```typescript
// src/common/constants/error-codes.ts
/**
 * Central error codes for cross-cutting concerns.
 * Feature-specific codes should be defined in their respective feature directories.
 */
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION.INVALID_INPUT',
    MISSING_FIELD: 'VALIDATION.MISSING_FIELD',
    INVALID_FORMAT: 'VALIDATION.INVALID_FORMAT',
  },

  // Server errors (500)
  SERVER: {
    INTERNAL_ERROR: 'SERVER.INTERNAL_ERROR',
    DATABASE_ERROR: 'SERVER.DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVER.SERVICE_UNAVAILABLE',
  },

  // Generic errors
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Type for error codes
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

**Step 2: Export from index**

```typescript
// src/common/constants/index.ts
export { ERROR_CODES } from './error-codes';
```

**Step 3: Commit**

```bash
git add src/common/constants/error-codes.ts src/common/constants/index.ts
git commit -m "feat: add central error codes for validation and server errors"
```

---

### Task 2: Response Helper Utility

**Files:**
- Create: `src/common/helpers/response.ts`
- Modify: `src/common/helpers/index.ts`

**Step 1: Create response helper file**

```typescript
// src/common/helpers/response.ts
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Utility class for sending consistent API responses.
 * All responses include timestamp and requestId for tracing.
 */
export class ResponseHelper {
  /**
   * Send a successful response (200 OK)
   *
   * @param res - Express response object
   * @param data - Response data
   * @param message - Optional success message
   * @param meta - Optional pagination metadata
   *
   * @example
   * ResponseHelper.success(res, user);
   * ResponseHelper.success(res, users, undefined, paginationMeta);
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    meta?: PaginationMeta
  ): void {
    res.json({
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    });
  }

  /**
   * Send a resource created response (201 Created)
   *
   * @param res - Express response object
   * @param data - Created resource data
   * @param message - Optional success message
   *
   * @example
   * ResponseHelper.created(res, newUser, 'User created successfully');
   */
  static created<T>(
    res: Response,
    data: T,
    message?: string
  ): void {
    res.status(201).json({
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    });
  }

  /**
   * Send an error response
   *
   * @param res - Express response object
   * @param statusCode - HTTP status code
   * @param code - Machine-readable error code (e.g., 'AUTH.INVALID_CREDENTIALS')
   * @param message - Human-readable error message
   * @param details - Optional field-level error details
   *
   * @example
   * ResponseHelper.error(res, 404, 'USER.NOT_FOUND', 'User not found');
   * ResponseHelper.error(res, 400, 'VALIDATION.INVALID_INPUT', 'Validation failed', { email: 'Invalid format' });
   */
  static error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string>
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    });
  }
}
```

**Step 2: Export from index**

```typescript
// src/common/helpers/index.ts
export { ResponseHelper, type PaginationMeta } from './response';
```

**Step 3: Commit**

```bash
git add src/common/helpers/response.ts src/common/helpers/index.ts
git commit -m "feat: add ResponseHelper utility for consistent API responses"
```

---

### Task 3: Pagination Helper Utility

**Files:**
- Create: `src/common/helpers/pagination.ts`
- Modify: `src/common/helpers/index.ts`

**Step 1: Create pagination helper file**

```typescript
// src/common/helpers/pagination.ts
import { PaginationMeta } from './response';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Utility class for handling pagination logic.
 * Supports offset-based pagination with configurable defaults.
 */
export class PaginationHelper {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  /**
   * Parse and validate pagination parameters from query string.
   * Ensures page and limit are valid numbers within acceptable ranges.
   *
   * @param params - Pagination parameters from query string
   * @param options - Optional configuration for defaults and limits
   * @returns Validated pagination values and calculated offset
   *
   * @example
   * const { page, limit, offset } = PaginationHelper.parseParams({ page: 2, limit: 10 });
   * // Returns: { page: 2, limit: 10, offset: 10 }
   */
  static parseParams(
    params: PaginationParams,
    options?: PaginationOptions
  ): { page: number; limit: number; offset: number } {
    const defaultLimit = options?.defaultLimit || this.DEFAULT_LIMIT;
    const maxLimit = options?.maxLimit || this.MAX_LIMIT;

    // Parse and validate page (minimum 1)
    let page = Math.max(1, Number(params.page) || 1);

    // Parse and validate limit (minimum 1, maximum maxLimit)
    let limit = Math.max(1, Number(params.limit) || defaultLimit);
    limit = Math.min(limit, maxLimit);

    // Calculate offset for database queries
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Build pagination metadata for response.
   * Calculates total pages based on total count and limit.
   *
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total number of items
   * @returns Pagination metadata object
   *
   * @example
   * const meta = PaginationHelper.buildMeta(2, 20, 150);
   * // Returns: { page: 2, limit: 20, total: 150, totalPages: 8 }
   */
  static buildMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
    };
  }
}
```

**Step 2: Export from index**

```typescript
// src/common/helpers/index.ts
export { ResponseHelper, type PaginationMeta } from './response';
export { PaginationHelper, type PaginationParams, type PaginationOptions } from './pagination';
```

**Step 3: Commit**

```bash
git add src/common/helpers/pagination.ts src/common/helpers/index.ts
git commit -m "feat: add PaginationHelper for offset-based pagination"
```

---

### Task 4: Pagination Validator

**Files:**
- Create: `src/common/validators/pagination.ts`

**Step 1: Create pagination validator file**

```typescript
// src/common/validators/pagination.ts
import { z } from 'zod';

/**
 * Reusable Zod schema for pagination query parameters.
 * Validates and transforms page and limit as numbers.
 *
 * @example
 * import { paginationSchema } from '@/common/validators/pagination';
 *
 * export const listUsersSchema = paginationSchema.extend({
 *   query: paginationSchema.shape.query.extend({
 *     role: z.enum(['admin', 'user']).optional(),
 *   }),
 * });
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .optional(),
  }),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
```

**Step 2: Commit**

```bash
git add src/common/validators/pagination.ts
git commit -m "feat: add reusable pagination Zod schema"
```

---

### Task 5: Request ID Middleware

**Files:**
- Create: `src/middleware/requestId.ts`

**Step 1: Create request ID middleware file**

```typescript
// src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to generate unique request IDs for tracing.
 * Attaches requestId to res.locals and sets X-Request-ID header.
 *
 * @example
 * app.use(requestIdMiddleware);
 */
export const requestIdMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
```

**Step 2: Commit**

```bash
git add src/middleware/requestId.ts
git commit -m "feat: add request ID middleware for request tracing"
```

---

### Task 6: Update AppError Class

**Files:**
- Modify: `src/common/utils/errors.ts`

**Step 1: Read current errors.ts**

Run: `cat src/common/utils/errors.ts`

**Step 2: Update AppError to include code and details**

```typescript
// src/common/utils/errors.ts
/**
 * Base application error class for operational errors.
 * Used for expected errors that should be handled gracefully (validation, not found, etc.).
 *
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (defaults to 500)
 * @param code - Machine-readable error code (e.g., 'AUTH.INVALID_CREDENTIALS')
 * @param details - Optional field-level error details
 *
 * @example
 * throw new AppError('Service temporarily unavailable', 503, 'SERVER.SERVICE_UNAVAILABLE');
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'SERVER.INTERNAL_ERROR',
    details?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource does not exist.
 * Returns 404 HTTP status code.
 *
 * @param resource - Name of the resource that was not found
 * @param code - Optional custom error code (defaults to 'NOT_FOUND')
 *
 * @example
 * throw new NotFoundError('User');
 * throw new NotFoundError('User', 'USER.NOT_FOUND');
 */
export class NotFoundError extends AppError {
  constructor(resource: string, code: string = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
  }
}

/**
 * Error thrown when authentication is required or credentials are invalid.
 * Returns 401 HTTP status code.
 *
 * @param message - Error message (defaults to 'Unauthorized')
 * @param code - Machine-readable error code
 *
 * @example
 * throw new UnauthorizedError('Invalid token', 'AUTH.TOKEN_INVALID');
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string) {
    super(message, 401, code);
  }
}

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate entries).
 * Returns 409 HTTP status code.
 *
 * @param message - Description of the conflict
 * @param code - Machine-readable error code
 *
 * @example
 * throw new ConflictError('User with this email already exists', 'AUTH.EMAIL_ALREADY_EXISTS');
 */
export class ConflictError extends AppError {
  constructor(message: string, code: string) {
    super(message, 409, code);
  }
}

/**
 * Error thrown when request validation fails.
 * Returns 400 HTTP status code.
 *
 * @param message - Description of the validation failure
 * @param code - Machine-readable error code (defaults to 'VALIDATION.INVALID_INPUT')
 * @param details - Optional field-level validation errors
 *
 * @example
 * throw new ValidationError('Validation failed', 'VALIDATION.INVALID_INPUT', {
 *   email: 'Invalid email format',
 *   password: 'Must be at least 8 characters'
 * });
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: string = 'VALIDATION.INVALID_INPUT',
    details?: Record<string, string>
  ) {
    super(message, 400, code, details);
  }
}
```

**Step 3: Commit**

```bash
git add src/common/utils/errors.ts
git commit -m "feat: enhance AppError with error codes and field-level details"
```

---

## Phase 2: Middleware Layer

### Task 7: Update Error Handler Middleware

**Files:**
- Modify: `src/middleware/errorHandler.ts`

**Step 1: Read current errorHandler.ts**

Run: `cat src/middleware/errorHandler.ts`

**Step 2: Update error handler to use ResponseHelper and handle Zod errors**

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/common/utils/errors';
import { ResponseHelper } from '@/common/helpers/response';
import { ERROR_CODES } from '@/common/constants/error-codes';

// Re-export AppError for convenience
export { AppError };

/**
 * Global error handling middleware for Express application.
 * Catches all errors passed via next(error) and formats consistent error responses.
 * Handles:
 * - Zod validation errors with field-level details
 * - AppError operational errors with status codes
 * - Unexpected errors (sanitized in production)
 *
 * @param err - Error object (ZodError, AppError, or generic Error)
 * @param req - Express request object (unused but required by Express error handler signature)
 * @param res - Express response object for sending error response
 * @param next - Express next function (unused but required by Express error handler signature)
 *
 * @example
 * // In routes or middleware:
 * throw new AppError('Invalid input', 400, 'VALIDATION.INVALID_INPUT');
 * // OR
 * next(new AppError('User not found', 404, 'USER.NOT_FOUND'));
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging (in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};

    // Extract field-level error messages
    err.errors.forEach((error) => {
      const field = error.path.join('.');
      details[field] = error.message;
    });

    ResponseHelper.error(
      res,
      400,
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      'Validation failed',
      details
    );
    return;
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    ResponseHelper.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details
    );
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  ResponseHelper.error(
    res,
    500,
    ERROR_CODES.SERVER.INTERNAL_ERROR,
    message
  );
};
```

**Step 3: Commit**

```bash
git add src/middleware/errorHandler.ts
git commit -m "feat: enhance error handler with ResponseHelper and Zod error support"
```

---

### Task 8: Add Request ID Middleware to App

**Files:**
- Modify: `src/index.ts`

**Step 1: Read current index.ts**

Run: `cat src/index.ts`

**Step 2: Add request ID middleware early in the chain**

Find this section:
```typescript
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

Add AFTER helmet() and BEFORE other middleware:
```typescript
import { requestIdMiddleware } from './middleware/requestId';

app.use(helmet());
app.use(requestIdMiddleware); // Add request ID to every request
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add request ID middleware to application"
```

---

## Phase 3: Feature Layer - Auth

### Task 9: Auth Error Codes

**Files:**
- Create: `src/features/auth/constants/error-codes.ts`

**Step 1: Create auth error codes file**

```typescript
// src/features/auth/constants/error-codes.ts
/**
 * Error codes specific to authentication feature.
 * Used for login, registration, token management, etc.
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH.INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'AUTH.TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH.TOKEN_INVALID',
  EMAIL_ALREADY_EXISTS: 'AUTH.EMAIL_ALREADY_EXISTS',
  REFRESH_TOKEN_INVALID: 'AUTH.REFRESH_TOKEN_INVALID',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
```

**Step 2: Commit**

```bash
git add src/features/auth/constants/error-codes.ts
git commit -m "feat(auth): add auth-specific error codes"
```

---

### Task 10: Auth Error Classes

**Files:**
- Create: `src/features/auth/errors/auth.errors.ts`

**Step 1: Create auth error classes file**

```typescript
// src/features/auth/errors/auth.errors.ts
import { AppError } from '@/common/utils/errors';
import { AUTH_ERROR_CODES } from '../constants/error-codes';

/**
 * Error thrown when login credentials are invalid.
 * Used for both incorrect email and incorrect password to avoid user enumeration.
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(
      'Invalid email or password',
      401,
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
  }
}

/**
 * Error thrown when a JWT token has expired.
 */
export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, AUTH_ERROR_CODES.TOKEN_EXPIRED);
  }
}

/**
 * Error thrown when a JWT token is malformed or invalid.
 */
export class TokenInvalidError extends AppError {
  constructor() {
    super('Invalid token', 401, AUTH_ERROR_CODES.TOKEN_INVALID);
  }
}

/**
 * Error thrown when a refresh token is invalid or revoked.
 */
export class RefreshTokenInvalidError extends AppError {
  constructor() {
    super(
      'Invalid or revoked refresh token',
      401,
      AUTH_ERROR_CODES.REFRESH_TOKEN_INVALID
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/features/auth/errors/auth.errors.ts
git commit -m "feat(auth): add auth-specific error classes"
```

---

### Task 11: Update Auth Service

**Files:**
- Modify: `src/features/auth/services/auth.service.ts`

**Step 1: Read current auth.service.ts**

Run: `cat src/features/auth/services/auth.service.ts`

**Step 2: Update to use new error classes**

Replace error throws:
- Old: `throw new UnauthorizedError('Invalid credentials')`
- New: `throw new InvalidCredentialsError()`

Replace:
- Old: `throw new ConflictError('User with this email already exists')`
- New: `throw new ConflictError('User with this email already exists', AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS)`

Add imports at top:
```typescript
import { InvalidCredentialsError, RefreshTokenInvalidError } from '../errors/auth.errors';
import { ConflictError } from '@/common/utils/errors';
import { AUTH_ERROR_CODES } from '../constants/error-codes';
```

Update register method:
```typescript
async register(email: string, password: string) {
  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new ConflictError(
      'User with this email already exists',
      AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS
    );
  }

  // ... rest of method
}
```

Update login method:
```typescript
async login(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new InvalidCredentialsError();
  }

  // ... rest of method
}
```

Update refresh method:
```typescript
async refresh(token: string) {
  const payload = tokenService.verifyRefreshToken(token);

  if (!payload) {
    throw new RefreshTokenInvalidError();
  }

  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });

  if (!storedToken || storedToken.revoked) {
    throw new RefreshTokenInvalidError();
  }

  // ... rest of method
}
```

**Step 3: Commit**

```bash
git add src/features/auth/services/auth.service.ts
git commit -m "feat(auth): update auth service to use new error classes"
```

---

### Task 12: Update Auth Routes

**Files:**
- Modify: `src/features/auth/routes/auth.routes.ts`

**Step 1: Read current auth.routes.ts**

Run: `cat src/features/auth/routes/auth.routes.ts`

**Step 2: Update to use ResponseHelper**

Add import:
```typescript
import { ResponseHelper } from '@/common/helpers/response';
```

Update register route:
```typescript
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res) => {
    const result = await authService.register(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.created(res, result, 'User registered successfully');
  })
);
```

Update login route:
```typescript
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res) => {
    const result = await authService.login(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.success(res, result);
  })
);
```

Update refresh route:
```typescript
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res) => {
    const result = await authService.refresh(req.validated!.body.refreshToken);
    ResponseHelper.success(res, result);
  })
);
```

Update logout route:
```typescript
router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res) => {
    await authService.logout(req.validated!.body.refreshToken);
    ResponseHelper.success(res, null, 'Logged out successfully');
  })
);
```

**Step 3: Commit**

```bash
git add src/features/auth/routes/auth.routes.ts
git commit -m "feat(auth): update auth routes to use ResponseHelper"
```

---

## Phase 4: Feature Layer - Users

### Task 13: User Error Codes

**Files:**
- Create: `src/features/users/constants/error-codes.ts`

**Step 1: Create user error codes file**

```typescript
// src/features/users/constants/error-codes.ts
/**
 * Error codes specific to user management feature.
 */
export const USER_ERROR_CODES = {
  NOT_FOUND: 'USER.NOT_FOUND',
  ALREADY_EXISTS: 'USER.ALREADY_EXISTS',
  CANNOT_DELETE_SELF: 'USER.CANNOT_DELETE_SELF',
} as const;

export type UserErrorCode = typeof USER_ERROR_CODES[keyof typeof USER_ERROR_CODES];
```

**Step 2: Commit**

```bash
git add src/features/users/constants/error-codes.ts
git commit -m "feat(users): add user-specific error codes"
```

---

### Task 14: Update User Service with Error Codes and Pagination

**Files:**
- Modify: `src/features/users/services/user.service.ts`

**Step 1: Read current user.service.ts**

Run: `cat src/features/users/services/user.service.ts`

**Step 2: Add pagination support and error codes**

Add imports:
```typescript
import { PaginationHelper, PaginationParams } from '@/common/helpers/pagination';
import { USER_ERROR_CODES } from '../constants/error-codes';
import { sql } from 'drizzle-orm';
```

Update findAll method to support pagination:
```typescript
async findAll(params: PaginationParams) {
  const { page, limit, offset } = PaginationHelper.parseParams(params);

  // Fetch users and total count in parallel
  const [userList, totalResult] = await Promise.all([
    db.select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).limit(limit).offset(offset),

    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);

  const meta = PaginationHelper.buildMeta(page, limit, totalResult[0].count);

  return { users: userList, meta };
}
```

Update findById to use USER_ERROR_CODES:
```typescript
async findById(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      password: false, // Don't return password
    },
  });

  if (!user) {
    throw new NotFoundError('User', USER_ERROR_CODES.NOT_FOUND);
  }

  return user;
}
```

**Step 3: Commit**

```bash
git add src/features/users/services/user.service.ts
git commit -m "feat(users): add pagination support and error codes to user service"
```

---

### Task 15: Update User Validators

**Files:**
- Modify: `src/features/users/validators/user.validators.ts`

**Step 1: Read current user.validators.ts**

Run: `cat src/features/users/validators/user.validators.ts`

**Step 2: Add pagination schema**

Add import:
```typescript
import { paginationSchema } from '@/common/validators/pagination';
```

Add list users schema:
```typescript
/**
 * Validation schema for listing users with pagination.
 */
export const listUsersSchema = paginationSchema;

export type ListUsersInput = z.infer<typeof listUsersSchema>;
```

**Step 3: Commit**

```bash
git add src/features/users/validators/user.validators.ts
git commit -m "feat(users): add pagination validator for list users"
```

---

### Task 16: Update User Routes

**Files:**
- Modify: `src/features/users/routes/user.routes.ts`

**Step 1: Read current user.routes.ts**

Run: `cat src/features/users/routes/user.routes.ts`

**Step 2: Add list endpoint and update to use ResponseHelper**

Add imports:
```typescript
import { ResponseHelper } from '@/common/helpers/response';
import { listUsersSchema } from '../validators/user.validators';
import { Request } from 'express';
```

Add list users route BEFORE the /:id route:
```typescript
// List users with pagination
router.get(
  '/',
  validate(listUsersSchema),
  asyncHandler(async (req: Request, res) => {
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  })
);
```

Update get user route:
```typescript
router.get(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.findById(req.params.id);
    ResponseHelper.success(res, user);
  })
);
```

Update update user route:
```typescript
router.put(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.update(req.params.id, req.validated!.body);
    ResponseHelper.success(res, user, 'User updated successfully');
  })
);
```

Update delete user route:
```typescript
router.delete(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    await userService.delete(req.params.id);
    ResponseHelper.success(res, null, 'User deleted successfully');
  })
);
```

**Step 3: Commit**

```bash
git add src/features/users/routes/user.routes.ts
git commit -m "feat(users): add pagination endpoint and update routes to use ResponseHelper"
```

---

## Phase 5: Update Health Check

### Task 17: Update Health Check to Use ResponseHelper

**Files:**
- Modify: `src/index.ts`

**Step 1: Find health check handler**

Current code:
```typescript
function handleHealthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

**Step 2: Update to use ResponseHelper**

Add import at top:
```typescript
import { ResponseHelper } from './common/helpers/response';
```

Update handler:
```typescript
function handleHealthCheck(_req: Request, res: Response): void {
  ResponseHelper.success(res, {
    status: 'ok',
    uptime: process.uptime(),
  });
}
```

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: update health check to use ResponseHelper"
```

---

## Phase 6: Testing

### Task 18: Run All Tests and Verify

**Step 1: Run tests**

Run: `npm test`

Expected: All tests should pass. Some tests may need updates if they check exact response format.

**Step 2: If tests fail, update test assertions**

Common updates needed:
- Response now includes `timestamp` and `requestId`
- Error responses now nested under `error` object
- Error responses include `code` field

Example error response test update:
```typescript
// Old
expect(response.body).toEqual({
  success: false,
  message: 'User not found'
});

// New
expect(response.body).toMatchObject({
  success: false,
  error: {
    code: 'USER.NOT_FOUND',
    message: 'User not found'
  }
});
expect(response.body).toHaveProperty('timestamp');
expect(response.body).toHaveProperty('requestId');
```

Example success response test update:
```typescript
// Old
expect(response.body).toEqual({
  success: true,
  data: expectedData
});

// New
expect(response.body).toMatchObject({
  success: true,
  data: expectedData
});
expect(response.body).toHaveProperty('timestamp');
expect(response.body).toHaveProperty('requestId');
```

**Step 3: Run tests again**

Run: `npm test`

Expected: All tests passing

**Step 4: Commit test updates**

```bash
git add src/**/__tests__/*.ts
git commit -m "test: update tests for new response format"
```

---

## Phase 7: Manual Testing

### Task 19: Manual API Testing

**Step 1: Start the server**

Run: `npm run dev`

**Step 2: Test health check**

Run: `curl http://localhost:3000/health | jq`

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123.456
  },
  "timestamp": "2026-01-17T12:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Check for `X-Request-ID` header:
Run: `curl -I http://localhost:3000/health`

**Step 3: Test validation error**

Run: `curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"invalid","password":"123"}' | jq`

Expected response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION.INVALID_INPUT",
    "message": "Validation failed",
    "details": {
      "body.email": "Invalid email",
      "body.password": "String must contain at least 8 character(s)"
    }
  },
  "timestamp": "2026-01-17T12:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Step 4: Test successful registration**

Run: `curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' | jq`

Expected: Status 201, response with `timestamp` and `requestId`

**Step 5: Test pagination**

Run: `curl http://localhost:3000/api/v1/users?page=1&limit=10 -H "Authorization: Bearer YOUR_TOKEN" | jq`

Expected response includes `meta`:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "timestamp": "...",
  "requestId": "..."
}
```

---

## Phase 8: Documentation

### Task 20: Update API Documentation

**Files:**
- Modify: `README.md` or create `docs/API.md`

**Step 1: Document new response format**

Add section explaining:
- All responses include `timestamp` and `requestId`
- Success responses: `{ success: true, data, message?, meta? }`
- Error responses: `{ success: false, error: { code, message, details? } }`
- Request ID available in `X-Request-ID` header

**Step 2: Document error codes**

List all error code namespaces:
- `VALIDATION.*` - Input validation errors
- `SERVER.*` - Server-side errors
- `AUTH.*` - Authentication errors
- `USER.*` - User management errors

**Step 3: Document pagination**

Explain query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Meta response format:
- `page`, `limit`, `total`, `totalPages`

**Step 4: Commit**

```bash
git add README.md docs/API.md
git commit -m "docs: update API documentation with new response format"
```

---

## Final Verification Checklist

Run through this checklist before considering the task complete:

- [ ] All tests passing (`npm test`)
- [ ] Health check returns new format
- [ ] Validation errors include field-level details
- [ ] All responses include `timestamp` and `requestId`
- [ ] `X-Request-ID` header present in all responses
- [ ] Error responses include error codes
- [ ] Pagination works on list endpoints
- [ ] Auth endpoints use new error classes
- [ ] User endpoints use pagination
- [ ] Manual testing confirms format changes
- [ ] Documentation updated

---

## Success Criteria

1. ✅ All responses follow standardized format
2. ✅ All errors include machine-readable codes
3. ✅ Validation errors provide field-level details
4. ✅ Pagination works consistently across list endpoints
5. ✅ Request IDs enable request tracing
6. ✅ All tests passing with updated response format
7. ✅ Breaking changes documented for API clients

---

**Implementation Notes:**

- Follow TDD where possible: write test first, see it fail, make it pass
- Commit frequently (after each task)
- Keep changes atomic and focused
- Run tests after each phase
- Manual testing after all code changes complete

**Estimated Time:** 2-3 hours for full implementation and testing
