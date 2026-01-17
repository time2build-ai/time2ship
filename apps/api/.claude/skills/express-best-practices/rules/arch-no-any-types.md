# arch-no-any-types

NEVER use `any` type. Use proper TypeScript types, interfaces, or `unknown` for truly dynamic data.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts

// WRONG: Using any types
export const userService = {
  async createUser(data: any): Promise<any> { // WRONG!
    const user = await db.insert(users).values(data).returning();
    return user;
  },

  async updateUser(id: string, updates: any): Promise<any> { // WRONG!
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  },

  async processData(payload: any): Promise<void> { // WRONG!
    // No type safety at all
    console.log(payload.someField); // Might not exist
  }
};

// features/users/routes/user.routes.ts
router.post('/users', async (req: any, res: any) => { // WRONG!
  const data: any = req.body; // WRONG!
  const user = await userService.createUser(data);
  res.json(user);
});

// Type assertions without proper types
function transform(data: any): any { // WRONG!
  return data as User; // Unsafe cast
}
```

## ✅ CORRECT

```typescript
// features/users/types/user.types.ts
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
}

// features/users/services/user.service.ts
import type { User, CreateUserInput, UpdateUserInput } from '../types/user.types';

export const userService = {
  // CORRECT: Explicit input and return types
  async createUser(data: CreateUserInput): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  // CORRECT: Typed partial updates
  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  },

  // CORRECT: Use unknown for truly dynamic data, then validate
  async processWebhook(payload: unknown): Promise<void> {
    // Validate unknown data with Zod
    const validated = webhookSchema.parse(payload);

    // Now we have type safety
    console.log(validated.userId);
  }
};

// features/users/routes/user.routes.ts
import { Request, Response } from 'express';
import type { CreateUserInput } from '../types/user.types';

// CORRECT: Properly typed route handler
router.post('/users', asyncHandler(async (req: Request, res: Response) => {
  // req.validated has been validated by middleware
  const data: CreateUserInput = req.validated.body;
  const user = await userService.createUser(data);
  res.status(201).json({ success: true, data: user });
}));

// CORRECT: Type guards for dynamic data
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

function processData(data: unknown): User {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data; // Now safely typed as User
}

// CORRECT: Generics for reusable utilities
function paginate<T>(items: T[], page: number, limit: number): T[] {
  return items.slice((page - 1) * limit, page * limit);
}
```

## Why This Matters

- **Type Safety**: Compiler catches errors at build time, not runtime
- **IntelliSense**: IDEs provide autocomplete and inline documentation
- **Refactoring**: Safe renames and changes across codebase
- **Self-Documentation**: Types document expected data structures
- **Bug Prevention**: Many bugs are impossible when types are correct
- **Maintainability**: Easier to understand code without reading implementation

When you think you need `any`:

1. **For user input**: Use Zod validation + type inference
2. **For dynamic data**: Use `unknown` then validate with type guards
3. **For flexible functions**: Use generics `<T>`
4. **For partial types**: Use TypeScript utilities (`Partial<User>`, `Pick<User, 'id'>`)
5. **For third-party libraries**: Write proper type definitions or use `@types/*`

Enable strict TypeScript settings in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

Reference: [Architecture Guidelines - TypeScript Conventions](../../../references/architecture.md#typescript-conventions)
