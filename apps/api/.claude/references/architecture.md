# API Architecture Documentation

> **Purpose**: Architectural patterns, rules, and conventions for Time2Ship API. Primary reference for AI assistants and developers.

## Architecture Overview

**Pattern**: Feature-based architecture (vertical slices) with layered internals.

**Core Principles**:

1. Feature Independence - Features are self-contained
2. Clear Separation: Routes → Services → Database
3. Type Safety - Strict TypeScript, no `any`
4. Explicit Over Implicit - Clear code over clever abstractions
5. Validation at Boundaries - Validate early, trust internal data

**Stack**: Express + TypeScript, Drizzle ORM, Zod, Helmet, CORS, Morgan

---

## Project Structure

```
src/
├── features/              # Feature modules (vertical slices)
│   ├── users/
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Business logic
│   │   ├── validators/   # Zod schemas
│   │   ├── schemas/      # Drizzle schemas
│   │   ├── types/        # TypeScript types
│   │   ├── errors/       # Error classes (optional)
│   │   └── __tests__/    # Unit tests
│   ├── auth/
│   └── posts/
├── common/               # Shared utilities
│   ├── utils/
│   ├── constants/
│   └── helpers/
├── middleware/           # Express middleware
├── types/                # Global types
├── config/               # Configuration
└── index.ts              # Entry point
```

---

## Feature Organization

### When to Create a New Feature

Create when:

- Distinct domain entity (users, posts, orders)
- Cohesive business capability
- 3+ routes/endpoints expected
- Likely to grow in complexity

### Feature Internal Structure

**REQUIRED nested structure**:

```
features/feature-name/
├── routes/
│   ├── index.ts
│   └── feature-name.routes.ts
├── services/
│   └── feature-name.service.ts
├── validators/
│   └── feature-name.validators.ts
├── schemas/
│   └── feature-name.schema.ts
├── types/
│   └── feature-name.types.ts
├── errors/                    # Optional
│   └── feature-name.errors.ts
└── __tests__/
    ├── feature-name.service.test.ts
    └── feature-name.routes.test.ts
```

### Feature Naming

- Use **singular nouns**: `user/`, `post/`, `order/`
- Exception: `auth/`, `analytics/` when plural makes sense

### Feature Registration

```typescript
// src/features/index.ts
import { Router } from "express";
import userRoutes from "./users/routes";
import authRoutes from "./auth/routes";

const router = Router();
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
export default router;
```

---

## Layering & Responsibilities

### Routes Layer (`features/{feature}/routes/`)

**Responsibilities**:

- Define HTTP endpoints
- Extract request data
- Call validation middleware
- Invoke services
- Send HTTP responses

**Rules**:

- ✅ MUST be thin - no business logic
- ✅ MUST use `asyncHandler` for async
- ✅ MUST validate via middleware
- ❌ MUST NOT access database directly
- ✅ MUST return consistent response format

### Services Layer (`features/{feature}/services/`)

**Responsibilities**:

- ALL business logic
- Orchestrate database operations
- Implement domain rules
- Call other services
- Transform data
- Handle business errors

**Rules**:

- ❌ MUST NOT access Express req/res
- ✅ MUST throw errors, not return them
- ✅ MUST be reusable across routes
- ✅ CAN call other feature services (document dependencies)
- ❌ MUST NOT contain SQL strings

### Validators Layer (`features/{feature}/validators/`)

**Responsibilities**:

- Define Zod schemas
- Export for reuse
- Define types via Zod inference

**Rules**:

- ✅ MUST use Zod
- ✅ MUST be used via middleware
- ❌ NO business logic
- ✅ Each route input MUST have schema

### Schemas Layer (`features/{feature}/schemas/`)

**Responsibilities**:

- Define Drizzle schemas
- Define relationships
- Export for queries

**Rules**:

- ✅ MUST use Drizzle syntax
- ✅ MUST define constraints
- ✅ Single source of truth for DB structure

---

## Database Layer (Drizzle ORM)

**Schema Organization**:

- One schema per feature: `features/{feature}/schemas/{feature}.schema.ts`
- Central import for migrations in `db/schema.ts`

**Access Pattern** (in services):

```typescript
import { db } from "@/config/database";
import { users } from "../schemas/user.schema";
import { eq } from "drizzle-orm";

const user = await db.select().from(users).where(eq(users.id, userId));
```

**Rules**:

- Database queries ONLY in service layer
- Use Drizzle query builder, NEVER raw SQL
- Use transactions for multi-table operations
- Convert database errors to business errors

---

## Validation Strategy

**Two Layers**:

1. **Zod** - API boundary (request validation)
2. **Drizzle** - Database boundary (data integrity)

**Zod Pattern**:

```typescript
// validators/user.validators.ts
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});
```

**Usage**:

```typescript
router.post("/", validate(createUserSchema), asyncHandler(controller.create));
```

**Validation Middleware** (`middleware/validation.middleware.ts`):

- Validates against Zod
- Returns 400 on invalid
- Attaches validated data to `req.validated`

---

## Error Handling

### Base Error Class

```typescript
// middleware/error-handler.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### Feature-Specific Errors

```typescript
// features/users/errors/user.errors.ts
export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(`User ${userId} not found`, 404);
  }
}
```

### Rules

- ✅ Services MUST throw errors
- ❌ Never return error objects
- ✅ Use specific error classes with status codes
- ✅ Global handler catches all
- ✅ Sanitize errors in production

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Error

---

## Authentication & Authorization

### Structure

```
features/auth/
├── routes/auth.routes.ts        # /login, /register
├── services/auth.service.ts     # JWT, hashing
├── validators/auth.validators.ts
└── middleware/
    ├── authenticate.ts          # Verify JWT
    └── authorize.ts             # Check permissions
```

### Pattern

1. Login via `/api/v1/auth/login`
2. JWT issued
3. Client sends `Authorization: Bearer <token>`
4. Middleware verifies, attaches `req.user`

### Protecting Routes

```typescript
import { authenticate } from "@/features/auth/middleware/authenticate";
import { authorize } from "@/features/auth/middleware/authorize";

router.get("/profile", authenticate, handler);
router.delete("/:id", authenticate, authorize(["admin"]), handler);
```

---

## API Versioning

**Pattern**: URL-based `/api/v1/`, `/api/v2/`

**Structure**:

```
features/users/routes/
├── v1/user.routes.ts
└── v2/user.routes.ts
```

**Registration**:

```typescript
app.use("/api/v1/users", userRoutesV1);
app.use("/api/v2/users", userRoutesV2);
```

**Rules**:

- Maintain backward compatibility for 1 version
- Document breaking changes
- Not all features need version updates simultaneously

---

## TypeScript Conventions

### Strict Mode Required

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Type Rules

1. ❌ **NO `any` types** - Use `unknown` if needed
2. ✅ **Explicit return types** - All functions MUST have them
3. ✅ **Use `interface` for objects** - `type` for unions/utilities
4. ✅ **Export types** - Share via feature `types/` folder

**Example**:

```typescript
// ✅ CORRECT
export interface User {
  id: string;
  email: string;
}

export function findUser(id: string): Promise<User | null> {
  // ...
}

// ❌ WRONG
export function findUser(id) {
  // No types
  // ...
}

export function findUser(id: string) {
  // No return type
  // ...
}
```

---

## File Naming Conventions

**Rules**:

- Use **kebab-case**: `user-service.ts`, `auth-middleware.ts`
- Be descriptive: `user.service.ts` not `service.ts`
- Include layer suffix: `.service.ts`, `.routes.ts`, `.middleware.ts`

**Examples**:

```
✅ CORRECT:
- user.service.ts
- user.routes.ts
- auth.middleware.ts
- user.schema.ts

❌ WRONG:
- UserService.ts        (PascalCase)
- user_service.ts       (snake_case)
- service.ts            (not descriptive)
- users.ts              (no suffix)
```

---

## Import Organization

**Order** (MUST follow):

1. External dependencies
2. Internal modules (`@/`)
3. Relative imports (same feature)
4. Type imports (`import type`)

**Example**:

```typescript
// 1. External
import { Router } from "express";
import { z } from "zod";

// 2. Internal
import { asyncHandler } from "@/middleware/async-handler";
import { AppError } from "@/middleware/error-handler";

// 3. Relative
import { userService } from "../services/user.service";

// 4. Types
import type { User } from "../types/user.types";
```

**Dependency Rules**:

- Features CAN import `common/`, `middleware/`, `types/`
- Features CAN import other features' services
- ❌ NO circular dependencies
- Document inter-feature dependencies

**Path Aliases** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": { "@/*": ["*"] }
  }
}
```

---

## Testing Strategy

**Organization**:

- Unit tests: `features/{feature}/__tests__/`
- E2E tests: Separate codebase

**What to Test**:

- Services: Business logic, errors, edge cases (MUST test, 80%+ coverage)
- Routes: Request/response, status codes (SHOULD test)
- Validators: Optional (Zod handles it)

**Rules**:

- Descriptive names: `should throw UserNotFoundError when user does not exist`
- Mock external dependencies
- Test error paths, not just happy paths

---

## Anti-Patterns

### ❌ Business Logic in Routes

```typescript
// ❌ WRONG
router.post('/users', async (req, res) => {
  const user = await db.query.users.findFirst(...);
  if (user) return res.status(409).json({ error: 'Exists' });
  // More logic here
});

// ✅ CORRECT
router.post('/users', validate(schema), asyncHandler(async (req, res) => {
  const user = await userService.create(req.validated.body);
  res.status(201).json({ success: true, data: user });
}));
```

### ❌ Direct Database Access from Routes

Routes MUST go through services.

### ❌ Using `any` Type

```typescript
// ❌ WRONG
function process(data: any) {}

// ✅ CORRECT
interface Data {
  value: string;
}
function process(data: Data): void {}
```

### ❌ Returning Errors from Services

```typescript
// ❌ WRONG
async function find(id: string): Promise<User | { error: string }> {
  if (!user) return { error: "Not found" };
}

// ✅ CORRECT
async function find(id: string): Promise<User> {
  if (!user) throw new UserNotFoundError(id);
  return user;
}
```

### ❌ Circular Dependencies

Feature A → Feature B → Feature A is forbidden.

### ❌ Magic Values

```typescript
// ❌ WRONG
if (user.role === "admin") {
}

// ✅ CORRECT
import { USER_ROLES } from "@/common/constants";
if (user.role === USER_ROLES.ADMIN) {
}
```

### ❌ Mixing Naming Conventions

Stick to camelCase (snake_case only for DB columns if needed).

---

## Decision Criteria

### New Feature vs Extend Existing

**Create New**:

- Distinct domain entity
- Independent capability
- 3+ routes
- Minimal overlap

**Extend Existing**:

- Closely related domain
- Shares database tables
- 1-2 routes

### Shared Code in `common/`

**Create in `common/`**:

- Used by 3+ features
- Pure utility
- No business logic

**Keep in Feature**:

- Used by 1-2 features
- Domain-specific

### Cross-Feature Service Calls

**Allowed**:

- No circular dependencies
- Well-documented
- Genuine code reuse need

**Avoid**:

- Creates tight coupling
- Would cause circular deps
- Can use events instead

---

## Summary Checklist

When adding functionality:

- [ ] Feature folder with required subfolders
- [ ] Thin routes (HTTP only)
- [ ] Business logic in services
- [ ] Zod validators for inputs
- [ ] Drizzle schema for DB tables
- [ ] Errors thrown, not returned
- [ ] Explicit return types
- [ ] No `any` types
- [ ] Imports organized correctly
- [ ] kebab-case file names
- [ ] Unit tests for services
- [ ] Feature registered in router
- [ ] No anti-patterns

---

**Version**: 1.0 | **Updated**: 2026-01-16
