# arch-no-business-in-routes

Route handlers must be thin HTTP adapters. ALL business logic belongs in service layer.

## ❌ WRONG

```typescript
// features/users/routes/user.routes.ts
router.post('/users', async (req, res) => {
  // Business logic in route handler - WRONG!
  const { email, password } = req.body;

  // Checking business rules
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Password hashing logic
  const hashedPassword = await bcrypt.hash(password, 10);

  // More business logic
  const user = await db.insert(users).values({
    email,
    password: hashedPassword,
    createdAt: new Date()
  }).returning();

  res.status(201).json({ success: true, data: user });
});
```

## ✅ CORRECT

```typescript
// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { validate } from '@/middleware/validation.middleware';
import { createUserSchema } from '../validators/user.validators';
import { userService } from '../services/user.service';

const router = Router();

router.post(
  '/users',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    // Route is thin - only HTTP concerns
    const user = await userService.createUser(req.validated.body);
    res.status(201).json({ success: true, data: user });
  })
);

export default router;

// features/users/services/user.service.ts
import { db } from '@/config/database';
import { users } from '../schemas/user.schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { UserAlreadyExistsError } from '../errors/user.errors';

export const userService = {
  async createUser(data: { email: string; password: string }): Promise<User> {
    // All business logic is in the service
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existing) {
      throw new UserAlreadyExistsError(data.email);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      createdAt: new Date()
    }).returning();

    return user;
  }
};
```

## Why This Matters

- **Testability**: Services can be unit tested without HTTP mocking
- **Reusability**: Same business logic can be called from multiple routes, CLI commands, or background jobs
- **Separation of Concerns**: Routes handle HTTP protocol, services handle domain logic
- **Maintainability**: Business rules are centralized, not scattered across route handlers
- **Single Responsibility**: Each layer has one reason to change

Routes should only:
1. Extract data from request
2. Call validation middleware
3. Invoke service methods
4. Format HTTP responses
5. Handle HTTP-specific concerns (headers, status codes)

Reference: [Architecture Guidelines - Routes Layer](../../../references/architecture.md#routes-layer)
