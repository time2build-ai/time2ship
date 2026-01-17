# quality-no-magic-values

Replace hardcoded values with named constants to improve readability, maintainability, and prevent errors.

## ❌ WRONG

```typescript
// user.service.ts - Magic values everywhere
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function createUser(email: string, password: string) {
  // What is 10? Why 10?
  const hashedPassword = await bcrypt.hash(password, 10);

  // Magic timeout value
  const result = await Promise.race([
    db.insert(users).values({ email, password: hashedPassword }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ]);

  return result;
}

export async function findRecentUsers() {
  // What does 30 represent? Days? Minutes?
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // What is 100? Max users? Page size?
  return db.select().from(users).limit(100);
}

// HTTP status codes as magic numbers
export function validateAge(age: number) {
  if (age < 18) {
    throw { status: 400, message: 'Too young' };
  }
  if (age > 120) {
    throw { status: 422, message: 'Invalid age' };
  }
}
```

## ✅ CORRECT

```typescript
// user.service.ts - Named constants
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Configuration constants at the top
const BCRYPT_SALT_ROUNDS = 10;
const DB_OPERATION_TIMEOUT_MS = 5000;
const RECENT_USERS_DAYS = 30;
const DEFAULT_PAGE_SIZE = 100;
const MIN_USER_AGE = 18;
const MAX_REALISTIC_AGE = 120;

// HTTP status codes
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNPROCESSABLE_ENTITY: 422,
} as const;

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const result = await Promise.race([
    db.insert(users).values({ email, password: hashedPassword }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), DB_OPERATION_TIMEOUT_MS)
    )
  ]);

  return result;
}

export async function findRecentUsers() {
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - (RECENT_USERS_DAYS * millisecondsInDay));

  return db.select().from(users).limit(DEFAULT_PAGE_SIZE);
}

export function validateAge(age: number) {
  if (age < MIN_USER_AGE) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `User must be at least ${MIN_USER_AGE} years old`
    };
  }
  if (age > MAX_REALISTIC_AGE) {
    throw {
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: `Age cannot exceed ${MAX_REALISTIC_AGE}`
    };
  }
}
```

## Why This Matters

- **Self-Documenting**: Constants explain what values mean without comments
- **Single Source of Truth**: Change a value in one place, not scattered across files
- **Type Safety**: `as const` provides literal type inference for constants
- **Easier Testing**: Constants can be mocked or adjusted for tests
- **Business Logic Clarity**: Validation rules become explicit and searchable
- **Prevent Typos**: Using `HTTP_STATUS.BAD_REQUEST` vs remembering "400"

**Common Magic Values to Replace**:
- HTTP status codes (use named constants or enums)
- Timeout durations
- Pagination limits
- Bcrypt salt rounds
- Date/time calculations
- Validation thresholds
