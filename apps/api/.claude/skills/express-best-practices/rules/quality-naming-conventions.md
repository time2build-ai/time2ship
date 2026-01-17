# quality-naming-conventions

Use consistent naming conventions across your codebase: camelCase for variables/functions, PascalCase for classes/types, UPPER_CASE for constants.

## ❌ WRONG

```typescript
// Inconsistent naming conventions
import type { Request, Response } from 'express';

// Constants not in UPPER_CASE
const max_retries = 3;
const default_timeout = 5000;

// Class not in PascalCase
class validationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Function using snake_case
export async function get_user_profile(req: Request, res: Response) {
  const User_ID = req.params.id; // Variable in PascalCase

  // Service method inconsistent
  const userData = await UserService.Find_By_ID(User_ID);

  res.json(userData);
}
```

## ✅ CORRECT

```typescript
// Consistent naming conventions
import type { Request, Response } from 'express';

// Constants in UPPER_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// Class in PascalCase
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Functions and variables in camelCase
export async function getUserProfile(req: Request, res: Response) {
  const userId = req.params.id;

  // Service method in camelCase
  const userData = await UserService.findById(userId);

  res.json(userData);
}

// Type/Interface in PascalCase
interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}
```

## Why This Matters

- **TypeScript Conventions**: Aligns with official TypeScript and JavaScript community standards
- **Visual Parsing**: Different casing helps developers instantly recognize constants vs variables
- **Team Consistency**: New developers can follow established patterns without documentation
- **Tooling Support**: Linters and formatters expect these conventions
- **Cross-Language Compatibility**: Matches conventions in most modern languages

**Reference**: [TypeScript Coding Guidelines](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)
