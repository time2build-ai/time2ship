# arch-type-inference-zod

Use Zod for validation AND type inference. Never duplicate types - infer TypeScript types from Zod schemas.

## ❌ WRONG

```typescript
// features/users/types/user.types.ts
// WRONG: Duplicating type definitions
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  age: number;
}

// features/users/validators/user.validators.ts
import { z } from 'zod';

// WRONG: Redefining the same structure in Zod
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
    age: z.number().int().min(18)
  })
});

// Now you have to maintain both definitions!
// If you add a field, you must update both places

// features/users/services/user.service.ts
import type { CreateUserInput } from '../types/user.types';

export const userService = {
  // Using the manually defined type
  async createUser(data: CreateUserInput): Promise<User> {
    // ...
  }
};
```

## ✅ CORRECT

```typescript
// features/users/validators/user.validators.ts
import { z } from 'zod';

// CORRECT: Single source of truth - Zod schema
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(8).max(72),
    name: z.string().min(1).max(100).trim(),
    age: z.number().int().min(18).max(120)
  })
});

// CORRECT: Infer TypeScript type from Zod schema
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];

// Additional schemas with inference
export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase().optional(),
    name: z.string().min(1).max(100).trim().optional(),
    age: z.number().int().min(18).max(120).optional()
  })
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string()
  })
});

export type LoginInput = z.infer<typeof loginSchema>['body'];

// features/users/services/user.service.ts
import type { CreateUserInput, UpdateUserInput } from '../validators/user.validators';

export const userService = {
  // CORRECT: Using inferred types
  async createUser(data: CreateUserInput): Promise<User> {
    // Type safety guaranteed - data matches validation
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [user] = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      age: data.age,
      createdAt: new Date()
    }).returning();

    return user;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    // Type ensures only valid fields can be updated
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
};

// Complex nested schemas with inference
export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    tags: z.array(z.string()).max(10).optional(),
    metadata: z.object({
      featured: z.boolean().default(false),
      scheduledAt: z.string().datetime().optional()
    }).optional()
  })
});

export type CreatePostInput = z.infer<typeof createPostSchema>['body'];

// Discriminated unions with Zod
export const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user.created'),
    userId: z.string().uuid(),
    email: z.string().email()
  }),
  z.object({
    type: z.literal('user.deleted'),
    userId: z.string().uuid()
  })
]);

export type Event = z.infer<typeof eventSchema>;
// Type is: { type: 'user.created', userId: string, email: string }
//        | { type: 'user.deleted', userId: string }
```

## Why This Matters

- **Single Source of Truth**: Schema is the only definition, no duplication
- **DRY Principle**: Define structure once, get validation + types
- **Consistency**: Types always match validation, impossible to drift
- **Refactoring**: Change schema once, types update automatically
- **Runtime Safety**: Validation happens at runtime, types enforced at compile time
- **Rich Validation**: Zod provides validation that TypeScript can't (email format, string length, etc.)
- **Less Code**: No need to maintain separate type definitions
- **Type Safety**: Inferred types are guaranteed to match validation

Zod inference patterns:
```typescript
// Basic inference
const schema = z.object({ name: z.string() });
type Type = z.infer<typeof schema>;
// Type is: { name: string }

// Nested schema
const schema = z.object({ body: z.object({ id: z.string() }) });
type Type = z.infer<typeof schema>['body'];
// Type is: { id: string }

// Array inference
const schema = z.array(z.string());
type Type = z.infer<typeof schema>;
// Type is: string[]

// Optional fields
const schema = z.object({
  required: z.string(),
  optional: z.string().optional()
});
type Type = z.infer<typeof schema>;
// Type is: { required: string; optional?: string | undefined }

// Default values
const schema = z.object({
  value: z.boolean().default(false)
});
type Type = z.infer<typeof schema>;
// Type is: { value?: boolean | undefined }
// After .parse(), value will be boolean (default applied)
```

Best practices:
1. Define Zod schemas first, types second via inference
2. Keep schemas in `validators/` folder
3. Export both schema and inferred type
4. Use `z.infer<typeof schema>` for type extraction
5. Add runtime transforms in Zod (trim, toLowerCase, etc.)
6. Use discriminated unions for polymorphic data

Reference: [Architecture Guidelines - Validation Strategy](../../../references/architecture.md#validation-strategy)
