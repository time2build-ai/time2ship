# quality-barrel-exports

Use index.ts barrel files to create clean public APIs for features while keeping internal implementation details private.

## ❌ WRONG

```typescript
// app.ts - Importing individual files directly
import { getUserById } from './features/users/user.controller';
import { createUser } from './features/users/user.service';
import { userSchema } from './features/users/user.schema';
import type { User } from './features/users/user.types';

// Problem: Consumers need to know internal file structure
// No control over what's public vs private
// Refactoring internals breaks imports everywhere
```

```typescript
// features/users/index.ts - Exporting everything (too permissive)
export * from './user.controller';
export * from './user.service';
export * from './user.schema';
export * from './user.types';

// Problem: Exposes internal implementation details
// Makes it hard to refactor without breaking consumers
```

## ✅ CORRECT

```typescript
// features/users/index.ts - Explicit, curated barrel exports
// Export only the public API of this feature

// Routes (always exported - this is the entry point)
export { userRouter } from './user.routes';

// Schemas (exported for request validation)
export {
  createUserSchema,
  updateUserSchema,
  userParamsSchema
} from './user.schema';

// Types (exported for type checking in other features)
export type {
  User,
  CreateUserDTO,
  UpdateUserDTO
} from './user.types';

// Services (exported ONLY if used by other features)
export { UserService } from './user.service';

// NOT exported (internal implementation details):
// - user.controller.ts functions (only used by routes)
// - Internal helper functions
// - Private types
// - Database query builders
```

**Usage Example**:

```typescript
// app.ts - Clean imports from feature barrel
import { userRouter } from './features/users';
import { orderRouter } from './features/orders';
import { paymentRouter } from './features/payments';

app.use('/users', userRouter);
app.use('/orders', orderRouter);
app.use('/payments', paymentRouter);
```

```typescript
// features/orders/order.service.ts - Cross-feature import
import { UserService } from '../users';
import type { User } from '../users';

export async function createOrderForUser(userId: string) {
  // Can use exported service and type
  const user = await UserService.findById(userId);
  // Cannot access user.controller functions (not exported)
}
```

**Advanced Pattern - Separate Internal/External Exports**:

```typescript
// features/users/index.ts - Public API
export { userRouter } from './user.routes';
export type { User } from './user.types';

// features/users/internal.ts - For testing or same-feature use
export { getUserById, createUser } from './user.controller';
export { hashPassword, validateEmail } from './user.helpers';
```

## Why This Matters

- **Encapsulation**: Hide implementation details, expose only public API
- **Refactoring Safety**: Change internal structure without breaking consumers
- **Clear Boundaries**: Explicit exports document what's meant to be public
- **Prevents Tight Coupling**: Other features can't reach into internal files
- **Better IntelliSense**: IDE autocomplete shows only intended public exports
- **Documentation**: Barrel file acts as a contract for the feature
- **Import Organization**: One import path per feature vs multiple file imports

**When to Export**:
- ✅ Routes (always - this is the feature entry point)
- ✅ Validation schemas (needed for request validation)
- ✅ Types/Interfaces (needed for type checking across features)
- ✅ Service classes (only if used by other features)
- ❌ Controller functions (internal to routes)
- ❌ Helper/utility functions (unless shared across features)
- ❌ Internal constants (unless part of public API)

**Reference**: This pattern supports the feature-based architecture in `apps/api/.claude/references/architecture.md`.
