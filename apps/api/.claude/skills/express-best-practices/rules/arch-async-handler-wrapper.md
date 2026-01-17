# arch-async-handler-wrapper

Wrap ALL async route handlers with asyncHandler to catch errors. Never use raw try-catch in routes.

## ❌ WRONG

```typescript
// features/users/routes/user.routes.ts

// WRONG: Unhandled promise rejection
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
  // If userService.findById throws, the app crashes!
});

// WRONG: Manual try-catch in every route
router.post('/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    // Error handling repeated in every route
    if (error instanceof UserAlreadyExistsError) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WRONG: Inconsistent error handling
router.put('/users/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    // Different error handling than other routes
    console.error(error);
    res.status(500).send('Error');
  }
});

// WRONG: Missing error handling entirely
router.delete('/users/:id', async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
  // Silently crashes on error
});
```

## ✅ CORRECT

```typescript
// middleware/async-handler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { userService } from '../services/user.service';

const router = Router();

// CORRECT: All async routes wrapped
router.get('/users/:id', asyncHandler(async (req, res) => {
  // No try-catch needed - asyncHandler catches errors
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));

router.post('/users', asyncHandler(async (req, res) => {
  // Clean route handler - errors automatically handled
  const user = await userService.createUser(req.validated.body);
  res.status(201).json({ success: true, data: user });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.updateUser(
    req.params.id,
    req.validated.body
  );
  res.json({ success: true, data: user });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
}));

// Multiple async operations
router.get('/users/:id/posts', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  const posts = await postService.findByUserId(user.id);
  res.json({ success: true, data: { user, posts } });
}));

export default router;

// middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';

/**
 * Global error handler - catches all errors passed via next()
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle operational errors (known errors)
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json({
    success: false,
    error: message
  });
};

// src/index.ts
import express from 'express';
import userRoutes from './features/users/routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(express.json());
app.use('/api/v1/users', userRoutes);

// Error handler must be LAST middleware
app.use(errorHandler);

export default app;
```

## Why This Matters

- **Crash Prevention**: Unhandled promise rejections crash Node.js process
- **DRY Principle**: Error handling logic centralized, not repeated in every route
- **Consistency**: All errors handled the same way
- **Cleaner Code**: Routes focus on happy path, not error handling
- **Maintainability**: Change error format once in error handler, affects all routes
- **Testing**: Easier to test - mock error handler, not try-catch in every route
- **Production Safety**: Errors logged and sanitized in one place

Common mistakes:
```typescript
// WRONG: Forgetting asyncHandler
router.get('/users', async (req, res) => { /* ... */ });

// CORRECT: Always wrap async handlers
router.get('/users', asyncHandler(async (req, res) => { /* ... */ }));

// WRONG: try-catch in route
router.post('/users', asyncHandler(async (req, res) => {
  try {
    // ...
  } catch (error) {
    // NO! asyncHandler + global error handler does this
  }
}));

// CORRECT: Let errors bubble up
router.post('/users', asyncHandler(async (req, res) => {
  // Just let service throw - asyncHandler + global handler catch it
  const user = await userService.createUser(req.validated.body);
  res.json({ success: true, data: user });
}));
```

Alternative implementation with generics:
```typescript
export const asyncHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<void>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

Reference: [Architecture Guidelines - Error Handling](../../../references/architecture.md#error-handling)
