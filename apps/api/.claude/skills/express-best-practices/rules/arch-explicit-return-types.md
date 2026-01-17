# arch-explicit-return-types

ALL functions and methods MUST have explicit return types. Never rely on type inference for function returns.

## ❌ WRONG

```typescript
// features/users/services/user.service.ts

export const userService = {
  // WRONG: No return type
  async findById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  },

  // WRONG: No return type
  async listUsers(page: number) {
    const users = await db.query.users.findMany({
      limit: 10,
      offset: (page - 1) * 10
    });
    return users;
  },

  // WRONG: No return type on helper function
  formatUser(user) {
    return {
      id: user.id,
      email: user.email
    };
  }
};

// features/auth/services/auth.service.ts
export const authService = {
  // WRONG: Return type not explicit
  async login(email: string, password: string) {
    const user = await userService.findByEmail(email);
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return { user, token: generateToken(user.id) };
  }
};

// Inline functions without return types
const processData = (data: User) => {
  return data.email.toLowerCase();
};
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

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
}

export interface FormattedUser {
  id: string;
  email: string;
}

// features/users/services/user.service.ts
import type { User, UserListResponse, FormattedUser } from '../types/user.types';

export const userService = {
  // CORRECT: Explicit return type
  async findById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  },

  // CORRECT: Explicit complex return type
  async listUsers(page: number): Promise<UserListResponse> {
    const users = await db.query.users.findMany({
      limit: 10,
      offset: (page - 1) * 10
    });

    const total = await db.select({ count: count() }).from(users);

    return {
      users,
      total: total[0].count,
      page
    };
  },

  // CORRECT: Explicit return type on helpers
  formatUser(user: User): FormattedUser {
    return {
      id: user.id,
      email: user.email
    };
  },

  // CORRECT: Void return type when nothing returned
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
};

// features/auth/types/auth.types.ts
export interface LoginResponse {
  user: User;
  token: string;
}

// features/auth/services/auth.service.ts
import type { LoginResponse } from '../types/auth.types';

export const authService = {
  // CORRECT: Explicit return type with interface
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await userService.findByEmail(email);
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return {
      user,
      token: generateToken(user.id)
    };
  }
};

// CORRECT: Inline functions with return types
const processData = (data: User): string => {
  return data.email.toLowerCase();
};

// CORRECT: Array and Promise return types
async function getUserEmails(userIds: string[]): Promise<string[]> {
  const users = await db.query.users.findMany({
    where: inArray(users.id, userIds)
  });
  return users.map(u => u.email);
}

// CORRECT: Union return types
function findUserOrGuest(id: string | null): Promise<User | GuestUser> {
  if (!id) {
    return Promise.resolve(createGuestUser());
  }
  return userService.findById(id);
}
```

## Why This Matters

- **Documentation**: Return types serve as inline documentation
- **Refactoring Safety**: Changes to implementation are caught if return type changes
- **Type Checking**: Ensures function actually returns what it claims to
- **IntelliSense**: Better IDE autocomplete for function consumers
- **Contract Enforcement**: Return type is a contract the function must fulfill
- **Error Prevention**: Catches accidental returns of wrong type
- **Consistency**: Makes codebase predictable and easier to navigate

Return type guidelines:
- Always specify return type for functions and methods
- For async functions, wrap in `Promise<T>`
- Use `void` when function returns nothing
- Create interfaces/types for complex return objects
- For arrays, specify element type: `User[]` or `Array<User>`
- For nullable returns, use union: `User | null`
- For generic utilities, use type parameters: `Promise<T>`

ESLint configuration to enforce:
```json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error"
  }
}
```

Reference: [Architecture Guidelines - Type Rules](../../../references/architecture.md#typescript-conventions)
