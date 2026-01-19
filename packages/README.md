# Shared Packages

This directory contains shared packages used across the Time2Ship monorepo.

## Available Packages

### @time2ship/types

TypeScript types and interfaces used by both client and API.

**Usage:**

```typescript
import { User, LoginResponse, ApiResponse } from '@time2ship/types';
```

**Contains:**

- User types and DTOs
- Authentication types (login, register, tokens)
- API response types
- Pagination types

### @time2ship/validators

Zod validation schemas for consistent validation across client and server.

**Usage:**

```typescript
import { loginSchema, registerSchema, paginationSchema } from '@time2ship/validators';

// Validate data
const result = loginSchema.safeParse(data);
```

**Contains:**

- Authentication validators (login, register, password reset, OTP)
- User validators (create, update)
- Common validators (pagination, email, password, ID params)

### @time2ship/utils

Utility functions for common operations.

**Usage:**

```typescript
import { formatCurrency, formatDate, slugify } from '@time2ship/utils';

const price = formatCurrency(1999.99); // "$1,999.99"
const slug = slugify('Hello World!'); // "hello-world"
```

**Contains:**

- **Formatters**: Currency, numbers, percentages, text truncation
- **Date helpers**: Date formatting, date math, comparisons
- **String helpers**: Capitalization, slugification, email validation/masking

### @time2ship/config

Configuration files (TypeScript configs, ESLint bases).

**Usage:**

```json
{
  "extends": "@time2ship/config/tsconfig.base.json"
}
```

## Adding a Package to Your App

### In API (apps/api)

Add to [package.json](../apps/api/package.json):

```json
{
  "dependencies": {
    "@time2ship/types": "*",
    "@time2ship/validators": "*",
    "@time2ship/utils": "*"
  }
}
```

Then run `npm install` from the root.

### In Client (apps/client)

Add to [package.json](../apps/client/package.json):

```json
{
  "dependencies": {
    "@time2ship/types": "*",
    "@time2ship/validators": "*",
    "@time2ship/utils": "*"
  }
}
```

Then run `npm install` from the root.

## Benefits

1. **Single Source of Truth**: Types and validators defined once, used everywhere
2. **Type Safety**: Guaranteed type consistency between frontend and backend
3. **DRY**: No code duplication across apps
4. **Easy Refactoring**: Change once, TypeScript shows you what needs updating
5. **Consistency**: Same validation rules on client and server

## Best Practices

1. **Keep packages focused**: Each package should have a single responsibility
2. **Export from index**: Always export through `src/index.ts` for clean imports
3. **Document exports**: Add JSDoc comments for better IDE autocomplete
4. **Version together**: All shared packages should use the same version
5. **Test shared code**: Add tests for shared utilities and validators
