# sec-input-validation-zod

Always validate and sanitize all user input using Zod schemas. Never trust client-provided data, including query params, path params, headers, and request bodies.

## ❌ WRONG

```typescript
// routes/users.routes.ts - NO VALIDATION
import { Router } from 'express';

const router = Router();

router.post('/users', async (req, res) => {
  // No validation - trusting client data
  const { email, password, age } = req.body;

  // What if email is not a string? What if age is negative?
  const user = await db.insert(users).values({
    email, // Could be malicious script
    password, // Could be empty string
    age, // Could be -999 or "not a number"
  });

  res.json(user);
});

// Type assertion without validation
router.get('/users/:id', async (req, res) => {
  const id = req.params.id as string; // What if id contains SQL?

  // No validation that id is valid UUID
  const user = await db.select().from(users).where(eq(users.id, id));
  res.json(user);
});

// No query param validation
router.get('/posts', async (req, res) => {
  const limit = req.query.limit; // Could be undefined, "abc", or "999999"
  const offset = req.query.offset;

  // Unsafe to use directly
  const posts = await db
    .select()
    .from(posts)
    .limit(limit) // Type error and potential DoS
    .offset(offset);

  res.json(posts);
});
```

## ✅ CORRECT

```typescript
// middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '@/utils/errors';

export interface ValidatedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
> extends Request {
  body: TBody;
  query: TQuery;
  params: TParams;
}

/**
 * Middleware to validate request with Zod schemas
 */
export const validate = <
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
>(schema: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query params
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // Validate path params
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          'Validation failed',
          400,
          error.errors // Include specific validation errors
        );
      }
      throw error;
    }
  };
};

// schemas/user.schemas.ts
import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    age: z
      .number()
      .int()
      .min(13, 'Must be at least 13 years old')
      .max(120, 'Invalid age')
      .optional(),
    name: z
      .string()
      .min(1, 'Name required')
      .max(100, 'Name too long')
      .trim(),
  }),
};

export const getUserSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
};

export const listPostsSchema = {
  query: z.object({
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .default('10'),
    offset: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0))
      .default('0'),
    sort: z
      .enum(['createdAt', 'updatedAt', 'title'])
      .default('createdAt'),
    order: z
      .enum(['asc', 'desc'])
      .default('desc'),
  }),
};

// routes/users.routes.ts - SECURE
import { Router } from 'express';
import { validate, ValidatedRequest } from '@/middleware/validate';
import { createUserSchema, getUserSchema } from '@/schemas/user.schemas';
import { UsersController } from './users.controller';

const router = Router();
const controller = new UsersController();

// Validated POST request
router.post(
  '/users',
  validate(createUserSchema),
  async (
    req: ValidatedRequest<z.infer<typeof createUserSchema.body>>,
    res
  ) => {
    // req.body is now validated and typed
    const user = await controller.createUser(req.body);
    res.status(201).json(user);
  }
);

// Validated GET with path params
router.get(
  '/users/:id',
  validate(getUserSchema),
  async (
    req: ValidatedRequest<unknown, unknown, z.infer<typeof getUserSchema.params>>,
    res
  ) => {
    // req.params.id is validated UUID
    const user = await controller.getUser(req.params.id);
    res.json(user);
  }
);

// Validated query params
router.get(
  '/posts',
  validate({ query: listPostsSchema.query }),
  async (
    req: ValidatedRequest<unknown, z.infer<typeof listPostsSchema.query>>,
    res
  ) => {
    // req.query is validated and transformed
    const posts = await controller.listPosts(req.query);
    res.json(posts);
  }
);

export default router;
```

## Why This Matters

- **Security Impact**: Unvalidated input is the root cause of most vulnerabilities including SQL injection, XSS, command injection, and business logic bypasses
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/), [A04:2021 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- **Type Safety**: Zod provides runtime validation AND type inference, ensuring TypeScript types match actual data
- **Transform & Sanitize**: Zod can transform data (trim strings, parse numbers) and sanitize input automatically
- **Early Rejection**: Fail fast at the API boundary before data reaches business logic or database
- **Clear Error Messages**: Zod provides detailed validation errors that help clients fix requests
- **Defense Against**: Type confusion, negative numbers where positive expected, missing required fields, malformed UUIDs/emails, oversized input (DoS)
- **Best Practice**: Define all schemas in separate files for reusability and testing. Validate ALL input sources: body, query, params, and even headers when used for logic
