# quality-feature-structure

Organize features into self-contained directories with consistent file structure: routes, controllers, services, schemas, and types.

## ❌ WRONG

```
apps/api/src/
├── controllers/
│   ├── user.controller.ts
│   ├── order.controller.ts
│   └── payment.controller.ts
├── services/
│   ├── user.service.ts
│   ├── order.service.ts
│   └── payment.service.ts
├── routes/
│   ├── user.routes.ts
│   ├── order.routes.ts
│   └── payment.routes.ts
├── schemas/
│   ├── user.schema.ts
│   ├── order.schema.ts
│   └── payment.schema.ts
└── types/
    ├── user.types.ts
    ├── order.types.ts
    └── payment.types.ts

// Problem: Feature code scattered across multiple directories
// Finding all user-related code requires navigating 5+ directories
// Imports become lengthy: ../../../services/user.service
// Hard to understand feature boundaries
```

## ✅ CORRECT

```
apps/api/src/features/
├── users/
│   ├── user.routes.ts       // Route definitions
│   ├── user.controller.ts   // Request handlers
│   ├── user.service.ts      // Business logic
│   ├── user.schema.ts       // Zod validation schemas
│   ├── user.types.ts        // TypeScript types
│   └── index.ts             // Barrel export
├── orders/
│   ├── order.routes.ts
│   ├── order.controller.ts
│   ├── order.service.ts
│   ├── order.schema.ts
│   ├── order.types.ts
│   └── index.ts
└── payments/
    ├── payment.routes.ts
    ├── payment.controller.ts
    ├── payment.service.ts
    ├── payment.schema.ts
    ├── payment.types.ts
    └── index.ts

// Benefits:
// - All user code in one directory
// - Short imports: ./user.service
// - Clear feature boundaries
// - Easy to move features or create microservices
```

**Example Feature Structure**:

```typescript
// features/users/index.ts - Barrel export
export { userRouter } from './user.routes';
export { UserService } from './user.service';
export { userSchema, updateUserSchema } from './user.schema';
export type { User, CreateUserDTO, UpdateUserDTO } from './user.types';

// app.ts - Clean feature imports
import { userRouter } from './features/users';
import { orderRouter } from './features/orders';
import { paymentRouter } from './features/payments';

app.use('/users', userRouter);
app.use('/orders', orderRouter);
app.use('/payments', paymentRouter);
```

## Why This Matters

- **Feature Isolation**: Each feature is self-contained and independently understandable
- **Easier Navigation**: Developers can find all related code in one directory
- **Better Imports**: Relative imports within feature are short (./user.service vs ../../../services/user.service)
- **Microservices Ready**: Features can be extracted to separate services easily
- **Team Collaboration**: Multiple developers can work on different features without conflicts
- **Testing**: Feature tests can be colocated in the same directory
- **Onboarding**: New developers can understand one feature at a time

**File Naming Convention**:
- `feature.routes.ts` - Express router with endpoint definitions
- `feature.controller.ts` - Request handlers (thin layer)
- `feature.service.ts` - Business logic and database operations
- `feature.schema.ts` - Zod validation schemas
- `feature.types.ts` - TypeScript interfaces and types
- `index.ts` - Barrel export for public API

**Reference**: See `apps/api/.claude/references/architecture.md` for detailed feature-based architecture patterns.
