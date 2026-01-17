# arch-custom-error-classes

Create custom error classes for domain-specific errors. Each error class should carry HTTP status code and context.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts

export const userService = {
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    // WRONG: Generic Error with no context
    if (!user) {
      throw new Error('Not found');
    }

    return user;
  },

  async createUser(data: CreateUserInput): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    // WRONG: Generic Error, no HTTP status code
    if (existing) {
      throw new Error('User exists');
    }

    // WRONG: Throwing strings (bad practice)
    if (!data.password) {
      throw 'Password required';
    }

    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    // WRONG: No context about which user or why it failed
    const result = await db.delete(users).where(eq(users.id, id));

    if (result.length === 0) {
      throw new Error('Delete failed');
    }
  }
};

// Route has to guess HTTP status codes
router.get('/users/:id', asyncHandler(async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json(user);
  } catch (error) {
    // WRONG: Guessing what status code to use
    res.status(404).json({ error: error.message });
  }
}));
```

## ✅ CORRECT

```typescript
// middleware/error-handler.ts
/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// features/users/errors/user.errors.ts
import { AppError } from '@/middleware/error-handler';

/**
 * Thrown when user is not found by ID or email
 */
export class UserNotFoundError extends AppError {
  constructor(identifier: string) {
    super(`User with identifier '${identifier}' not found`, 404);
  }
}

/**
 * Thrown when attempting to create user with existing email
 */
export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, 409);
  }
}

/**
 * Thrown when user update validation fails
 */
export class InvalidUserUpdateError extends AppError {
  constructor(reason: string) {
    super(`Invalid user update: ${reason}`, 400);
  }
}

/**
 * Thrown when user tries to perform unauthorized action
 */
export class UnauthorizedUserActionError extends AppError {
  constructor(userId: string, action: string) {
    super(`User '${userId}' is not authorized to ${action}`, 403);
  }
}

// features/auth/errors/auth.errors.ts
import { AppError } from '@/middleware/error-handler';

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', 401);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Authentication token has expired', 401);
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super('Invalid authentication token', 401);
  }
}

// features/users/services/user.service.ts
import { UserNotFoundError, UserAlreadyExistsError } from '../errors/user.errors';
import type { User, CreateUserInput } from '../types/user.types';

export const userService = {
  // CORRECT: Throws specific error with context
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id); // Clear error with ID
    }

    return user;
  },

  async findByEmail(email: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      throw new UserNotFoundError(email); // Reusable error class
    }

    return user;
  },

  async createUser(data: CreateUserInput): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      throw new UserAlreadyExistsError(data.email); // Specific 409 error
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      ...data,
      password: hashedPassword
    }).returning();

    return user;
  },

  async deleteUser(id: string): Promise<void> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new UserNotFoundError(id); // Clear why delete failed
    }
  },

  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    // Validate business rules
    if (updates.email) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, updates.email)
      });

      if (existing && existing.id !== id) {
        throw new UserAlreadyExistsError(updates.email);
      }
    }

    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
};

// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { userService } from '../services/user.service';

const router = Router();

// CORRECT: Clean routes - error classes carry status codes
router.get('/users/:id', asyncHandler(async (req, res) => {
  // No error handling needed - global middleware handles it
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));

router.post('/users', asyncHandler(async (req, res) => {
  // UserAlreadyExistsError automatically returns 409
  const user = await userService.createUser(req.validated.body);
  res.status(201).json({ success: true, data: user });
}));

export default router;

// middleware/error-handler.ts (continued)
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err.stack
      })
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Generic 500 for unexpected errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
};
```

## Why This Matters

- **Type Safety**: Can catch specific error types with `instanceof`
- **HTTP Status Codes**: Each error carries correct status code
- **Context**: Error messages include relevant IDs, emails, etc.
- **Consistency**: All 404 errors look the same, all 409 errors look the same
- **Debugging**: Stack traces and error names help identify source
- **Self-Documenting**: Error class name explains what went wrong
- **Client Experience**: Consistent error responses across API
- **Monitoring**: Can track error types in logs/monitoring tools

Error naming conventions:
- Suffix with `Error`: `UserNotFoundError`, not `UserNotFound`
- Be specific: `InvalidCredentialsError` not `AuthError`
- Include context: `EmailAlreadyTakenError` not `ConflictError`
- Use domain language: `OrderCancelledError` not `OperationError`

Common HTTP status codes:
```typescript
// 400 - Bad Request (client error)
export class InvalidInputError extends AppError {
  constructor(field: string) {
    super(`Invalid input for field: ${field}`, 400);
  }
}

// 401 - Unauthorized (authentication required)
export class UnauthenticatedError extends AppError {
  constructor() {
    super('Authentication required', 401);
  }
}

// 403 - Forbidden (authenticated but not allowed)
export class ForbiddenError extends AppError {
  constructor(action: string) {
    super(`Not authorized to perform: ${action}`, 403);
  }
}

// 404 - Not Found
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 404);
  }
}

// 409 - Conflict
export class ResourceConflictError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, 409);
  }
}

// 422 - Unprocessable Entity (validation failed)
export class ValidationError extends AppError {
  constructor(message: string) {
    super(`Validation failed: ${message}`, 422);
  }
}
```

Reference: [Architecture Guidelines - Error Handling](../../../references/architecture.md#error-handling)
