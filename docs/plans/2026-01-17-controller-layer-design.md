# Controller Layer Architecture Design

**Date**: 2026-01-17
**Status**: Approved
**Author**: Architecture Team

## Overview

Add a controller layer to the API architecture to separate HTTP concerns from business logic, making routes cleaner and services more framework-agnostic.

## Problem Statement

Current routes mix HTTP handling with service orchestration:
- Routes contain inline async functions with business flow
- Hard to see route structure at a glance
- Services are clean but routes are verbose
- No clear HTTP-specific layer between routing and business logic

## Solution: Controller Layer

Introduce a controller layer that handles HTTP-specific concerns while keeping services pure.

### Controller Responsibilities

**What Controllers DO:**
- Extract data from Express `Request` object (params, query, body, user)
- Pass clean, primitive data to services (no Express types)
- Handle service responses and format them using `ResponseHelper`
- Manage HTTP status codes and response structure
- Provide clear contract between HTTP layer and business logic

**What Controllers DO NOT Do:**
- Business logic (stays in services)
- Database operations (stays in services)
- Validation (handled by middleware before controller)
- Authentication (handled by middleware before controller)

### Benefits

- Routes become pure routing definitions (path + middleware chain)
- Services remain framework-agnostic and easier to test
- Clear single responsibility for each layer
- Better code organization and discoverability
- Routes are scannable - see all endpoints at a glance

## Architecture

### Updated Layer Structure

```
Request Flow:
Client → Route → Middleware (validate, auth) → Controller → Service → Database
                                                     ↓
                                                 Response
```

**Layers:**
1. **Routes**: Define endpoints and middleware chains
2. **Middleware**: Validate, authenticate, handle cross-cutting concerns
3. **Controllers**: Extract request data, call services, format responses (NEW)
4. **Services**: Business logic, database operations
5. **Database**: Drizzle ORM queries

### File Structure

Each feature adds a `controllers/` folder:

```
features/users/
├── controllers/                    # NEW
│   └── user.controller.ts
├── routes/
│   ├── index.ts
│   └── user.routes.ts
├── services/
│   └── user.service.ts
├── validators/
│   └── user.validators.ts
├── schemas/
│   └── user.schema.ts
├── types/
│   └── user.types.ts
└── __tests__/
    ├── user.controller.test.ts    # NEW
    ├── user.service.test.ts
    └── user.routes.test.ts
```

### Naming Conventions

- **File**: `{feature}.controller.ts` (e.g., `user.controller.ts`, `auth.controller.ts`)
- **Class**: `{Feature}Controller` (e.g., `UserController`, `AuthController`)
- **Export**: `export const {feature}Controller = new {Feature}Controller()`

Mirrors the existing service pattern for consistency.

## Implementation Pattern

### Controller Structure

Class-based controllers with singleton exports:

```typescript
// features/users/controllers/user.controller.ts
import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ResponseHelper } from '@/common/helpers/response';
import { AuthRequest } from '@/features/auth/middleware/authenticate';

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    const user = await userService.findById(req.params.id);
    ResponseHelper.success(res, user);
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    const user = await userService.update(
      req.params.id,
      req.validated!.body
    );
    ResponseHelper.success(res, user, 'User updated successfully');
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    await userService.delete(req.params.id);
    ResponseHelper.success(res, null, 'User deleted successfully');
  }
}

export const userController = new UserController();
```

**Key Points:**
- Each method corresponds to one route endpoint
- Extract data from req, pass primitives to service
- Use ResponseHelper for consistent responses
- Type parameters with Request/AuthRequest and Response
- Return `Promise<void>` (response is sent, nothing returned)
- Use `.bind(controllerInstance)` when passing to asyncHandler

### Refactored Routes

**Before:**
```typescript
router.get(
  '/',
  validate(listUsersSchema),
  asyncHandler(async (req: Request, res) => {
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  })
);
```

**After:**
```typescript
import { userController } from '../controllers/user.controller';

router.get(
  '/',
  validate(listUsersSchema),
  asyncHandler(userController.list.bind(userController))
);
```

**Complete Example:**
```typescript
// features/users/routes/user.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/features/auth/middleware/authenticate';
import { userController } from '../controllers/user.controller';
import { getUserSchema, updateUserSchema, listUsersSchema } from '../validators/user.validators';

const router = Router();

router.use(authenticate);

router.get('/', validate(listUsersSchema), asyncHandler(userController.list.bind(userController)));
router.get('/:id', validate(getUserSchema), asyncHandler(userController.getById.bind(userController)));
router.put('/:id', validate(updateUserSchema), asyncHandler(userController.update.bind(userController)));
router.delete('/:id', validate(getUserSchema), asyncHandler(userController.delete.bind(userController)));

export default router;
```

### Auth Controller Example

```typescript
// features/auth/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ResponseHelper } from '@/common/helpers/response';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.created(res, result, 'User registered successfully');
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.success(res, result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(req.validated!.body.refreshToken);
    ResponseHelper.success(res, result);
  }

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.validated!.body.refreshToken);
    ResponseHelper.success(res, null, 'Logged out successfully');
  }
}

export const authController = new AuthController();
```

## Testing Strategy

### Controller Tests

Focus: Verify controllers call correct services with correct data.

```typescript
// features/users/__tests__/user.controller.test.ts
import { Request, Response } from 'express';
import { userController } from '../controllers/user.controller';
import { userService } from '../services/user.service';
import { ResponseHelper } from '@/common/helpers/response';

jest.mock('../services/user.service');
jest.mock('@/common/helpers/response');

describe('UserController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      validated: { body: {} }
    };
    mockRes = {};
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should call userService.findById and return success response', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockReq.params = { id: '1' };
      (userService.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.getById(mockReq as Request, mockRes as Response);

      expect(userService.findById).toHaveBeenCalledWith('1');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockUser);
    });
  });
});
```

**Testing Focus:**
- ✅ Controller calls correct service method
- ✅ Controller passes correct parameters from req
- ✅ Controller uses ResponseHelper correctly
- ❌ Don't retest service business logic in controller tests

**Test Distribution:**
- **Controllers**: Light tests - verify orchestration
- **Services**: Heavy tests - verify business logic (already exists)
- **Routes**: Optional integration tests

## Migration Strategy

**Approach**: Incremental refactoring (not big bang)

### Implementation Steps

1. **Create controller infrastructure**
   - Add `controllers/` folder to existing features (users, auth)
   - Create controller classes with methods matching current routes
   - Export singleton instances

2. **Refactor routes to use controllers**
   - Import controller instances
   - Replace inline async functions with controller method references
   - Keep middleware chains intact (validate, authenticate, asyncHandler)

3. **Update tests**
   - Add controller unit tests
   - Update existing route tests if needed
   - Service tests remain unchanged

4. **Update documentation**
   - Add controller layer to architecture.md
   - Update project structure diagrams
   - Add examples and rules

5. **Update architecture checklist**
   - Add "Controller with HTTP-only logic" to checklist

### Migration Order

1. Users feature (simpler, good template)
2. Auth feature (similar pattern)
3. Future features follow the new pattern automatically

### No Breaking Changes

- All APIs remain identical
- Middleware stays the same
- Services unchanged
- Only internal code organization improves

## Documentation Updates Required

Update `apps/api/.claude/references/architecture.md`:

### 1. Project Structure (lines 24-44)

Add controllers to the feature structure:

```markdown
features/
├── users/
│   ├── routes/       # Express route handlers
│   ├── controllers/  # HTTP request/response handling
│   ├── services/     # Business logic
│   ├── validators/   # Zod schemas
│   ├── schemas/      # Drizzle schemas
│   ├── types/        # TypeScript types
│   └── __tests__/    # Unit tests
```

### 2. Add Controllers Layer Section (after line 124)

```markdown
### Controllers Layer (`features/{feature}/controllers/`)

**Responsibilities**:
- Extract data from Express Request (params, query, body, user)
- Call service methods with clean data
- Format responses using ResponseHelper
- Handle HTTP-specific concerns

**Rules**:
- ✅ MUST be thin - orchestration only
- ✅ MUST extract data and pass primitives to services
- ❌ MUST NOT contain business logic
- ❌ MUST NOT access database directly
- ✅ MUST use ResponseHelper for responses
- ✅ MUST use class-based pattern with singleton export
- ✅ MUST return Promise<void> (responses sent, not returned)
```

### 3. Update Routes Layer (lines 107-123)

Update responsibilities:

**Current:**
- Define HTTP endpoints
- Extract request data
- Call validation middleware
- Invoke services
- Send HTTP responses

**Updated:**
- Define HTTP endpoints
- Define middleware chains
- Invoke controllers via asyncHandler
- Pure routing configuration

**Rules Update:**
- ✅ MUST be thin - no business logic
- ✅ MUST use controller methods (no inline functions)
- ✅ MUST use `asyncHandler` for async controller methods
- ✅ MUST bind controller methods when passing to asyncHandler
- ❌ MUST NOT call services directly
- ❌ MUST NOT contain inline async functions with business flow

### 4. Update Architecture Checklist (line 607)

Add to checklist:

```markdown
- [ ] Controller with HTTP-only logic
- [ ] Routes use controller methods (no inline functions)
```

## Rules and Conventions

### Controller Layer Rules

- ✅ **MUST** be class-based with singleton export
- ✅ **MUST** extract data from req and pass primitives to services
- ✅ **MUST** use ResponseHelper for all responses
- ✅ **MUST** return `Promise<void>`
- ❌ **MUST NOT** contain business logic
- ❌ **MUST NOT** access database directly
- ❌ **MUST NOT** perform validation (use middleware)
- ✅ **CAN** orchestrate multiple service calls
- ✅ **CAN** transform service responses for HTTP

### Routes Layer Rules (Updated)

- ✅ **MUST** use controller methods via asyncHandler
- ✅ **MUST** bind controller instance when passing methods
- ❌ **MUST NOT** contain inline async functions with logic
- ❌ **MUST NOT** call services directly
- ✅ **MUST** define middleware chains (validate, authenticate, etc.)
- ✅ **MUST** be pure routing configuration

## Anti-Patterns

### ❌ Business Logic in Controllers

```typescript
// WRONG - business logic in controller
async create(req: Request, res: Response): Promise<void> {
  const existing = await db.query.users.findFirst(...);
  if (existing) {
    throw new AppError('User exists', 409);
  }
  // More logic...
}

// CORRECT - delegate to service
async create(req: Request, res: Response): Promise<void> {
  const user = await userService.create(
    req.validated!.body.email,
    req.validated!.body.password
  );
  ResponseHelper.created(res, user, 'User created successfully');
}
```

### ❌ Inline Functions in Routes

```typescript
// WRONG - inline async function
router.get('/', asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  ResponseHelper.success(res, users);
}));

// CORRECT - controller method
router.get('/', asyncHandler(userController.list.bind(userController)));
```

### ❌ Passing Request Object to Services

```typescript
// WRONG - passing Express types to service
async update(req: AuthRequest, res: Response): Promise<void> {
  const user = await userService.update(req); // Don't pass req
  ResponseHelper.success(res, user);
}

// CORRECT - extract primitives
async update(req: AuthRequest, res: Response): Promise<void> {
  const user = await userService.update(
    req.params.id,
    req.validated!.body
  );
  ResponseHelper.success(res, user);
}
```

### ❌ Forgetting to Bind Controller Methods

```typescript
// WRONG - 'this' will be undefined
router.get('/', asyncHandler(userController.list));

// CORRECT - bind the controller instance
router.get('/', asyncHandler(userController.list.bind(userController)));
```

## Summary

The controller layer provides:
- **Separation of concerns**: HTTP vs business logic
- **Cleaner routes**: Pure routing configuration
- **Framework-agnostic services**: No Express dependencies
- **Better testability**: Clear unit boundaries
- **Consistent patterns**: Mirrors existing service structure

This change is **non-breaking** and improves code organization without changing any APIs.

---

**Next Steps**: Proceed with implementation following the migration strategy.
