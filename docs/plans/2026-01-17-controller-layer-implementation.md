# Controller Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use @superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add controller layer to users and auth features, refactor routes to use controllers, add tests, and update architecture documentation.

**Architecture:** Introduce a controller layer between routes and services. Controllers handle HTTP request/response concerns while services remain framework-agnostic. Class-based pattern with singleton exports matching the existing service pattern.

**Tech Stack:** TypeScript, Express, Jest

---

## Task 1: Create User Controller with Tests (TDD)

**Files:**
- Create: `apps/api/src/features/users/controllers/user.controller.ts`
- Create: `apps/api/src/features/users/__tests__/user.controller.test.ts`

### Step 1: Write the failing test for list method

Create the test file:

```typescript
// apps/api/src/features/users/__tests__/user.controller.test.ts
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

  describe('list', () => {
    it('should call userService.findAll and return success response with meta', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'user2@example.com', createdAt: new Date(), updatedAt: new Date() }
      ];
      const mockMeta = { page: 1, limit: 10, total: 2, totalPages: 1 };
      mockReq.query = { page: '1', limit: '10' };

      (userService.findAll as jest.Mock).mockResolvedValue({ users: mockUsers, meta: mockMeta });

      await userController.list(mockReq as Request, mockRes as Response);

      expect(userService.findAll).toHaveBeenCalledWith(mockReq.query);
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockUsers, undefined, mockMeta);
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: FAIL with "Cannot find module '../controllers/user.controller'"

### Step 3: Create controllers directory

Run: `mkdir -p apps/api/src/features/users/controllers`

### Step 4: Write minimal implementation for list method

```typescript
// apps/api/src/features/users/controllers/user.controller.ts
import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ResponseHelper } from '@/common/helpers/response';
import { AuthRequest } from '@/features/auth/middleware/authenticate';

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  }
}

export const userController = new UserController();
```

### Step 5: Run test to verify it passes

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: PASS (1 test passing)

### Step 6: Commit

```bash
git add apps/api/src/features/users/controllers/user.controller.ts apps/api/src/features/users/__tests__/user.controller.test.ts
git commit -m "test: add UserController with list method and test"
```

---

## Task 2: Add getById Method to User Controller (TDD)

**Files:**
- Modify: `apps/api/src/features/users/controllers/user.controller.ts`
- Modify: `apps/api/src/features/users/__tests__/user.controller.test.ts`

### Step 1: Write the failing test for getById method

Add to test file after the `list` describe block:

```typescript
  describe('getById', () => {
    it('should call userService.findById and return success response', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockReq.params = { id: '123' };

      (userService.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.getById(mockReq as Request, mockRes as Response);

      expect(userService.findById).toHaveBeenCalledWith('123');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockUser);
    });
  });
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: FAIL with "userController.getById is not a function"

### Step 3: Add getById method to controller

Add method to UserController class:

```typescript
  async getById(req: AuthRequest, res: Response): Promise<void> {
    const user = await userService.findById(req.params.id);
    ResponseHelper.success(res, user);
  }
```

### Step 4: Run test to verify it passes

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: PASS (2 tests passing)

### Step 5: Commit

```bash
git add apps/api/src/features/users/controllers/user.controller.ts apps/api/src/features/users/__tests__/user.controller.test.ts
git commit -m "test: add UserController getById method and test"
```

---

## Task 3: Add update Method to User Controller (TDD)

**Files:**
- Modify: `apps/api/src/features/users/controllers/user.controller.ts`
- Modify: `apps/api/src/features/users/__tests__/user.controller.test.ts`

### Step 1: Write the failing test for update method

Add to test file after the `getById` describe block:

```typescript
  describe('update', () => {
    it('should call userService.update and return success response with message', async () => {
      const mockUser = {
        id: '123',
        email: 'updated@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockReq.params = { id: '123' };
      mockReq.validated = {
        body: { email: 'updated@example.com', password: 'NewPass123!' }
      };

      (userService.update as jest.Mock).mockResolvedValue(mockUser);

      await userController.update(mockReq as Request, mockRes as Response);

      expect(userService.update).toHaveBeenCalledWith('123', mockReq.validated!.body);
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockUser, 'User updated successfully');
    });
  });
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: FAIL with "userController.update is not a function"

### Step 3: Add update method to controller

Add method to UserController class:

```typescript
  async update(req: AuthRequest, res: Response): Promise<void> {
    const user = await userService.update(
      req.params.id,
      req.validated!.body
    );
    ResponseHelper.success(res, user, 'User updated successfully');
  }
```

### Step 4: Run test to verify it passes

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: PASS (3 tests passing)

### Step 5: Commit

```bash
git add apps/api/src/features/users/controllers/user.controller.ts apps/api/src/features/users/__tests__/user.controller.test.ts
git commit -m "test: add UserController update method and test"
```

---

## Task 4: Add delete Method to User Controller (TDD)

**Files:**
- Modify: `apps/api/src/features/users/controllers/user.controller.ts`
- Modify: `apps/api/src/features/users/__tests__/user.controller.test.ts`

### Step 1: Write the failing test for delete method

Add to test file after the `update` describe block:

```typescript
  describe('delete', () => {
    it('should call userService.delete and return success response with message', async () => {
      mockReq.params = { id: '123' };

      (userService.delete as jest.Mock).mockResolvedValue(undefined);

      await userController.delete(mockReq as Request, mockRes as Response);

      expect(userService.delete).toHaveBeenCalledWith('123');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, null, 'User deleted successfully');
    });
  });
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: FAIL with "userController.delete is not a function"

### Step 3: Add delete method to controller

Add method to UserController class:

```typescript
  async delete(req: AuthRequest, res: Response): Promise<void> {
    await userService.delete(req.params.id);
    ResponseHelper.success(res, null, 'User deleted successfully');
  }
```

### Step 4: Run test to verify it passes

Run: `cd apps/api && npm test -- user.controller.test.ts`

Expected: PASS (4 tests passing)

### Step 5: Commit

```bash
git add apps/api/src/features/users/controllers/user.controller.ts apps/api/src/features/users/__tests__/user.controller.test.ts
git commit -m "test: add UserController delete method and test"
```

---

## Task 5: Refactor User Routes to Use Controller

**Files:**
- Modify: `apps/api/src/features/users/routes/user.routes.ts`

### Step 1: Read current routes file

Run: `cat apps/api/src/features/users/routes/user.routes.ts`

This lets you see the exact current implementation.

### Step 2: Refactor routes to use controller

Replace the entire file content:

```typescript
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

### Step 3: Run E2E tests to verify routes still work

Run: `cd apps/api && npm run test:e2e`

Expected: All E2E tests should pass (no breaking changes)

### Step 4: Commit

```bash
git add apps/api/src/features/users/routes/user.routes.ts
git commit -m "refactor: update user routes to use controller"
```

---

## Task 6: Create Auth Controller with Tests (TDD)

**Files:**
- Create: `apps/api/src/features/auth/controllers/auth.controller.ts`
- Create: `apps/api/src/features/auth/__tests__/auth.controller.test.ts`

### Step 1: Write the failing test for register method

Create the test file:

```typescript
// apps/api/src/features/auth/__tests__/auth.controller.test.ts
import { Request, Response } from 'express';
import { authController } from '../controllers/auth.controller';
import { authService } from '../services/auth.service';
import { ResponseHelper } from '@/common/helpers/response';

jest.mock('../services/auth.service');
jest.mock('@/common/helpers/response');

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      validated: { body: {} }
    };
    mockRes = {};
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return created response', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };
      mockReq.validated = {
        body: { email: 'test@example.com', password: 'Password123!' }
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(authService.register).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(ResponseHelper.created).toHaveBeenCalledWith(mockRes, mockResult, 'User registered successfully');
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: FAIL with "Cannot find module '../controllers/auth.controller'"

### Step 3: Create controllers directory

Run: `mkdir -p apps/api/src/features/auth/controllers`

### Step 4: Write minimal implementation for register method

```typescript
// apps/api/src/features/auth/controllers/auth.controller.ts
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
}

export const authController = new AuthController();
```

### Step 5: Run test to verify it passes

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: PASS (1 test passing)

### Step 6: Commit

```bash
git add apps/api/src/features/auth/controllers/auth.controller.ts apps/api/src/features/auth/__tests__/auth.controller.test.ts
git commit -m "test: add AuthController with register method and test"
```

---

## Task 7: Add login Method to Auth Controller (TDD)

**Files:**
- Modify: `apps/api/src/features/auth/controllers/auth.controller.ts`
- Modify: `apps/api/src/features/auth/__tests__/auth.controller.test.ts`

### Step 1: Write the failing test for login method

Add to test file after the `register` describe block:

```typescript
  describe('login', () => {
    it('should call authService.login and return success response', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };
      mockReq.validated = {
        body: { email: 'test@example.com', password: 'Password123!' }
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: FAIL with "authController.login is not a function"

### Step 3: Add login method to controller

Add method to AuthController class:

```typescript
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.success(res, result);
  }
```

### Step 4: Run test to verify it passes

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: PASS (2 tests passing)

### Step 5: Commit

```bash
git add apps/api/src/features/auth/controllers/auth.controller.ts apps/api/src/features/auth/__tests__/auth.controller.test.ts
git commit -m "test: add AuthController login method and test"
```

---

## Task 8: Add refresh Method to Auth Controller (TDD)

**Files:**
- Modify: `apps/api/src/features/auth/controllers/auth.controller.ts`
- Modify: `apps/api/src/features/auth/__tests__/auth.controller.test.ts`

### Step 1: Write the failing test for refresh method

Add to test file after the `login` describe block:

```typescript
  describe('refresh', () => {
    it('should call authService.refresh and return success response', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      mockReq.validated = {
        body: { refreshToken: 'old-refresh-token' }
      };

      (authService.refresh as jest.Mock).mockResolvedValue(mockResult);

      await authController.refresh(mockReq as Request, mockRes as Response);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: FAIL with "authController.refresh is not a function"

### Step 3: Add refresh method to controller

Add method to AuthController class:

```typescript
  async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(req.validated!.body.refreshToken);
    ResponseHelper.success(res, result);
  }
```

### Step 4: Run test to verify it passes

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: PASS (3 tests passing)

### Step 5: Commit

```bash
git add apps/api/src/features/auth/controllers/auth.controller.ts apps/api/src/features/auth/__tests__/auth.controller.test.ts
git commit -m "test: add AuthController refresh method and test"
```

---

## Task 9: Add logout Method to Auth Controller (TDD)

**Files:**
- Modify: `apps/api/src/features/auth/controllers/auth.controller.ts`
- Modify: `apps/api/src/features/auth/__tests__/auth.controller.test.ts`

### Step 1: Write the failing test for logout method

Add to test file after the `refresh` describe block:

```typescript
  describe('logout', () => {
    it('should call authService.logout and return success response with message', async () => {
      mockReq.validated = {
        body: { refreshToken: 'refresh-token' }
      };

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(authService.logout).toHaveBeenCalledWith('refresh-token');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, null, 'Logged out successfully');
    });
  });
```

### Step 2: Run test to verify it fails

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: FAIL with "authController.logout is not a function"

### Step 3: Add logout method to controller

Add method to AuthController class:

```typescript
  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.validated!.body.refreshToken);
    ResponseHelper.success(res, null, 'Logged out successfully');
  }
```

### Step 4: Run test to verify it passes

Run: `cd apps/api && npm test -- auth.controller.test.ts`

Expected: PASS (4 tests passing)

### Step 5: Commit

```bash
git add apps/api/src/features/auth/controllers/auth.controller.ts apps/api/src/features/auth/__tests__/auth.controller.test.ts
git commit -m "test: add AuthController logout method and test"
```

---

## Task 10: Refactor Auth Routes to Use Controller

**Files:**
- Modify: `apps/api/src/features/auth/routes/auth.routes.ts`

### Step 1: Read current routes file

Run: `cat apps/api/src/features/auth/routes/auth.routes.ts`

This lets you see the exact current implementation.

### Step 2: Refactor routes to use controller

Replace the entire file content:

```typescript
import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authController } from '../controllers/auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register.bind(authController)));
router.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh.bind(authController)));
router.post('/logout', validate(refreshTokenSchema), asyncHandler(authController.logout.bind(authController)));

export default router;
```

### Step 3: Run E2E tests to verify routes still work

Run: `cd apps/api && npm run test:e2e`

Expected: All E2E tests should pass (no breaking changes)

### Step 4: Commit

```bash
git add apps/api/src/features/auth/routes/auth.routes.ts
git commit -m "refactor: update auth routes to use controller"
```

---

## Task 11: Update Architecture Documentation

**Files:**
- Modify: `apps/api/.claude/references/architecture.md`

### Step 1: Read current architecture.md to identify exact line numbers

Run: `head -n 130 apps/api/.claude/references/architecture.md | tail -n 20`

This shows lines 110-130 to confirm where to insert the Controllers section.

### Step 2: Add controllers to project structure (around line 26)

Find this section:
```markdown
features/
├── users/
│   ├── routes/       # Express route handlers
│   ├── services/     # Business logic
```

Update to:
```markdown
features/
├── users/
│   ├── routes/       # Express route handlers
│   ├── controllers/  # HTTP request/response handling
│   ├── services/     # Business logic
```

Also update the feature internal structure section (around line 64):
```markdown
features/feature-name/
├── routes/
│   ├── index.ts
│   └── feature-name.routes.ts
├── controllers/                    # NEW
│   └── feature-name.controller.ts
├── services/
```

### Step 3: Add Controllers Layer section after Services Layer (after line 142)

Insert new section:

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

### Step 4: Update Routes Layer responsibilities (around line 107-123)

Find the Routes Layer section and update **Responsibilities**:

Current:
```markdown
**Responsibilities**:

- Define HTTP endpoints
- Extract request data
- Call validation middleware
- Invoke services
- Send HTTP responses
```

Updated:
```markdown
**Responsibilities**:

- Define HTTP endpoints
- Define middleware chains
- Invoke controllers via asyncHandler
- Pure routing configuration
```

Update **Rules**:

Current:
```markdown
**Rules**:

- ✅ MUST be thin - no business logic
- ✅ MUST use `asyncHandler` for async
- ✅ MUST validate via middleware
- ❌ MUST NOT access database directly
- ✅ MUST return consistent response format
```

Updated:
```markdown
**Rules**:

- ✅ MUST be thin - no business logic
- ✅ MUST use controller methods (no inline functions)
- ✅ MUST use `asyncHandler` for async controller methods
- ✅ MUST bind controller methods when passing to asyncHandler
- ❌ MUST NOT call services directly
- ❌ MUST NOT contain inline async functions with business flow
```

### Step 5: Update architecture checklist (around line 607)

Add these items:

```markdown
- [ ] Controller with HTTP-only logic
- [ ] Routes use controller methods (no inline functions)
```

### Step 6: Verify changes don't break markdown formatting

Run: `cd apps/api && head -n 650 .claude/references/architecture.md | tail -n 50`

This shows the end of the file to verify checklist is formatted correctly.

### Step 7: Commit

```bash
git add apps/api/.claude/references/architecture.md
git commit -m "docs: update architecture.md with controller layer"
```

---

## Task 12: Run Full Test Suite and Verify

**Files:**
- None (verification step)

### Step 1: Run all unit tests

Run: `cd apps/api && npm test`

Expected: All tests pass (including new controller tests)

### Step 2: Run E2E tests

Run: `cd apps/api && npm run test:e2e`

Expected: All E2E tests pass (no breaking changes)

### Step 3: Check TypeScript compilation

Run: `cd apps/api && npx tsc --noEmit`

Expected: No TypeScript errors

### Step 4: Final verification commit

If everything passes, create a verification commit:

```bash
git add .
git commit -m "chore: verify controller layer implementation complete

All unit tests passing
All E2E tests passing
TypeScript compilation successful
No breaking changes"
```

---

## Summary

This plan implements the controller layer using TDD:

1. **Tasks 1-4**: Build UserController method-by-method with tests first
2. **Task 5**: Refactor user routes to use controller
3. **Tasks 6-9**: Build AuthController method-by-method with tests first
4. **Task 10**: Refactor auth routes to use controller
5. **Task 11**: Update architecture documentation
6. **Task 12**: Final verification

**Key Principles Applied:**
- **TDD**: Write test first, watch it fail, implement, watch it pass
- **YAGNI**: Only implement what's needed, no extra features
- **DRY**: Controllers follow consistent pattern
- **Frequent commits**: One commit per completed method

**Total Commits**: ~12 commits (one per task)

**Estimated Time**: 1-2 hours for careful TDD implementation
