# arch-services-throw-errors

Services MUST throw errors, never return error objects. Use typed error classes with HTTP status codes.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts
export const userService = {
  // WRONG: Returning error objects
  async findById(id: string): Promise<User | { error: string }> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      return { error: 'User not found' }; // WRONG!
    }

    return user;
  },

  // WRONG: Returning null/undefined for errors
  async createUser(data: CreateUserInput): Promise<User | null> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      return null; // WRONG! Lost error context
    }

    return user;
  }
};

// Route has to handle error objects
router.get('/users/:id', async (req, res) => {
  const result = await userService.findById(req.params.id);

  // Ugly error checking in route
  if ('error' in result) {
    return res.status(404).json(result);
  }

  res.json({ success: true, data: result });
});
```

## ✅ CORRECT

```typescript
// features/users/errors/user.errors.ts
import { AppError } from '@/middleware/error-handler';

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`, 404);
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 409);
    this.name = 'UserAlreadyExistsError';
  }
}

// features/users/services/user.service.ts
import { UserNotFoundError, UserAlreadyExistsError } from '../errors/user.errors';
import type { User, CreateUserInput } from '../types/user.types';

export const userService = {
  // CORRECT: Throws typed errors
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id); // Clean error throw
    }

    return user; // Type is always User, never error
  },

  // CORRECT: Throws on error conditions
  async createUser(data: CreateUserInput): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      throw new UserAlreadyExistsError(data.email);
    }

    const [user] = await db.insert(users).values(data).returning();
    return user;
  }
};

// features/users/routes/user.routes.ts
import { asyncHandler } from '@/middleware/async-handler';

// Route is clean - asyncHandler catches errors
router.get('/users/:id', asyncHandler(async (req, res) => {
  // No error checking needed
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));

// middleware/error-handler.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler converts errors to HTTP responses
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

## Why This Matters

- **Type Safety**: Return types are clean - `Promise<User>` not `Promise<User | ErrorObject>`
- **Centralized Error Handling**: Global middleware converts errors to HTTP responses
- **Better DX**: No need to check for error objects in every caller
- **Stack Traces**: Thrown errors preserve call stack for debugging
- **Error Context**: Custom error classes carry status codes and additional context
- **Consistency**: All services handle errors the same way
- **Cleaner Routes**: Route handlers don't need error checking logic

Service error guidelines:
- Always throw for error conditions
- Use typed error classes extending `AppError`
- Include context in error messages (IDs, emails, etc.)
- Set appropriate HTTP status codes in error class
- Never return `null`, `undefined`, or error objects for failures

Reference: [Architecture Guidelines - Error Handling](../../../references/architecture.md#error-handling)
