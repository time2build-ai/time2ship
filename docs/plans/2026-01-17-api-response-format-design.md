# API Response Format & Error Code Enhancement Design

**Date:** 2026-01-17
**Status:** Approved
**Implementation Strategy:** Big Bang

## Overview

Comprehensive improvement to the API boilerplate including:
- Standardized response format with metadata
- Namespaced error code system
- Response helper utilities
- Enhanced pagination support
- Field-level validation error details

## Response Format Structure

### Success Response
```typescript
{
  success: true,
  data: T,              // Actual response data
  message?: string,     // Optional success message
  timestamp: string,    // ISO 8601 timestamp
  requestId: string,    // Unique request identifier (UUID)
  meta?: {              // Optional metadata for lists/pagination
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,           // Namespaced error code (e.g., "AUTH.INVALID_CREDENTIALS")
    message: string,        // Human-readable error message
    details?: Record<string, string>  // Field-level validation errors
  },
  timestamp: string,
  requestId: string
}
```

## Error Code System

### Organization Strategy: Hybrid
- **Central codes** (`common/constants/error-codes.ts`): Cross-cutting concerns (validation, server, rate limiting)
- **Feature codes** (`features/{feature}/constants/error-codes.ts`): Domain-specific errors

### Naming Convention
- Format: `NAMESPACE.SPECIFIC_ERROR`
- All uppercase with underscores
- Examples: `AUTH.INVALID_CREDENTIALS`, `USER.NOT_FOUND`, `VALIDATION.INVALID_INPUT`

### Central Error Codes
```typescript
export const ERROR_CODES = {
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION.INVALID_INPUT',
    MISSING_FIELD: 'VALIDATION.MISSING_FIELD',
    INVALID_FORMAT: 'VALIDATION.INVALID_FORMAT',
  },
  SERVER: {
    INTERNAL_ERROR: 'SERVER.INTERNAL_ERROR',
    DATABASE_ERROR: 'SERVER.DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVER.SERVICE_UNAVAILABLE',
  },
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
```

### Feature-Specific Error Codes

**Auth** (`features/auth/constants/error-codes.ts`):
```typescript
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH.INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'AUTH.TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH.TOKEN_INVALID',
  EMAIL_ALREADY_EXISTS: 'AUTH.EMAIL_ALREADY_EXISTS',
  REFRESH_TOKEN_INVALID: 'AUTH.REFRESH_TOKEN_INVALID',
} as const;
```

**Users** (`features/users/constants/error-codes.ts`):
```typescript
export const USER_ERROR_CODES = {
  NOT_FOUND: 'USER.NOT_FOUND',
  ALREADY_EXISTS: 'USER.ALREADY_EXISTS',
  CANNOT_DELETE_SELF: 'USER.CANNOT_DELETE_SELF',
} as const;
```

## Response Helper Utilities

### Core Helper (`common/helpers/response.ts`)

```typescript
export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    meta?: PaginationMeta
  ): void

  static created<T>(
    res: Response,
    data: T,
    message?: string
  ): void

  static error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string>
  ): void
}
```

### Usage
```typescript
// Success
ResponseHelper.success(res, user);
ResponseHelper.success(res, user, 'User updated successfully');

// Created
ResponseHelper.created(res, newUser, 'User created successfully');

// With pagination
ResponseHelper.success(res, users, undefined, meta);
```

## Pagination System

### Style: Offset-based
- Query parameters: `?page=2&limit=20`
- Metadata: `{ page, limit, total, totalPages }`

### Pagination Helper (`common/helpers/pagination.ts`)

```typescript
export class PaginationHelper {
  static parseParams(
    params: PaginationParams,
    options?: PaginationOptions
  ): { page: number; limit: number; offset: number }

  static buildMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta
}
```

### Configuration
- Default limit: 20
- Maximum limit: 100

## Enhanced Error Classes

### Base AppError
```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'SERVER.INTERNAL_ERROR',
    details?: Record<string, string>
  )
}
```

### Common Subclasses
- `NotFoundError` - 404 errors with custom code
- `ValidationError` - 400 errors with field-level details
- `UnauthorizedError` - 401 errors with custom code
- `ConflictError` - 409 errors with custom code

### Feature-Specific Errors

**Auth errors** (`features/auth/errors/auth.errors.ts`):
```typescript
export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', 401, AUTH_ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, AUTH_ERROR_CODES.TOKEN_EXPIRED);
  }
}
```

## Middleware Updates

### Request ID Middleware (`middleware/requestId.ts`)
- Generates UUID for each request
- Stores in `res.locals.requestId`
- Sets `X-Request-ID` response header

### Enhanced Error Handler (`middleware/errorHandler.ts`)
- Handles `ZodError` with field-level details
- Handles `AppError` with error codes
- Uses `ResponseHelper.error()`
- Sanitizes unexpected errors in production

## Validation Error Handling

### Format: Field-level details
```typescript
{
  success: false,
  error: {
    code: "VALIDATION.INVALID_INPUT",
    message: "Validation failed",
    details: {
      "email": "Invalid email format",
      "password": "Must be at least 8 characters"
    }
  },
  timestamp: "...",
  requestId: "..."
}
```

### Zod Integration
Error handler automatically extracts field errors from `ZodError` and formats them as details.

## File Structure

### New Files
1. `common/constants/error-codes.ts` - Central error codes
2. `common/helpers/response.ts` - Response helper utilities
3. `common/helpers/pagination.ts` - Pagination utilities
4. `common/validators/pagination.ts` - Reusable pagination schema
5. `middleware/requestId.ts` - Request ID middleware
6. `features/auth/constants/error-codes.ts` - Auth error codes
7. `features/auth/errors/auth.errors.ts` - Auth error classes
8. `features/users/constants/error-codes.ts` - User error codes

### Files to Update
1. `common/utils/errors.ts` - Add code and details fields
2. `middleware/errorHandler.ts` - Use ResponseHelper, handle Zod errors
3. `features/auth/routes/auth.routes.ts` - Use ResponseHelper
4. `features/auth/services/auth.service.ts` - Use error codes
5. `features/users/routes/user.routes.ts` - Use ResponseHelper + pagination
6. `features/users/services/user.service.ts` - Use error codes + pagination
7. `features/users/validators/user.validators.ts` - Add pagination schema
8. `index.ts` - Add requestId middleware

## Breaking Changes

### Response Format Changes
- **Added**: `timestamp`, `requestId` to all responses
- **Added**: `meta` object for paginated responses
- **Changed**: Error responses now nested under `error` object
- **Added**: Error responses include `code` field
- **Added**: Validation errors include `details` object

### Migration for API Clients

**Old Success Response:**
```json
{ "success": true, "data": {...} }
```

**New Success Response:**
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2026-01-17T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Old Error Response:**
```json
{ "success": false, "message": "User not found" }
```

**New Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "USER.NOT_FOUND",
    "message": "User not found"
  },
  "timestamp": "2026-01-17T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Implementation Order

### Phase 1: Foundation
1. Create `common/constants/error-codes.ts`
2. Create `common/helpers/response.ts`
3. Create `common/helpers/pagination.ts`
4. Create `common/validators/pagination.ts`
5. Create `middleware/requestId.ts`
6. Update `common/utils/errors.ts`

### Phase 2: Middleware
1. Update `middleware/errorHandler.ts`
2. Add `requestIdMiddleware` to `index.ts`

### Phase 3: Features
1. Create `features/auth/constants/error-codes.ts`
2. Create `features/auth/errors/auth.errors.ts`
3. Update `features/auth/services/auth.service.ts`
4. Update `features/auth/routes/auth.routes.ts`
5. Create `features/users/constants/error-codes.ts`
6. Update `features/users/services/user.service.ts`
7. Update `features/users/routes/user.routes.ts`
8. Update `features/users/validators/user.validators.ts`

## Testing Checklist

- [ ] All success responses include `timestamp`, `requestId`
- [ ] All error responses include error `code`
- [ ] Validation errors include field-level `details`
- [ ] Pagination returns correct `meta` object
- [ ] Request ID appears in response headers (`X-Request-ID`)
- [ ] Error codes are consistent across features
- [ ] Zod validation errors properly formatted
- [ ] Health check endpoint works
- [ ] All existing tests updated and passing

## Documentation Updates Needed

- [ ] Update API documentation with new response format
- [ ] Document all error codes
- [ ] Update example requests/responses in README
- [ ] Add migration guide for API clients
- [ ] Document pagination parameters

## Dependencies

### New Dependencies
```json
{
  "uuid": "^9.0.0"
}
```

### Dev Dependencies
```json
{
  "@types/uuid": "^9.0.0"
}
```

## Success Criteria

1. ✅ All responses follow standardized format
2. ✅ All errors include machine-readable codes
3. ✅ Validation errors provide field-level details
4. ✅ Pagination works consistently across list endpoints
5. ✅ Request IDs enable request tracing
6. ✅ No breaking changes to HTTP status codes
7. ✅ All tests passing with updated response format

---

**Design approved:** 2026-01-17
**Implementation strategy:** Big Bang
**Target completion:** TBD
