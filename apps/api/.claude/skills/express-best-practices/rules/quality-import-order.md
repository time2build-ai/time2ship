# quality-import-order

Maintain consistent import organization by grouping external dependencies, internal modules, and types in a predictable order.

## ❌ WRONG

```typescript
// user.controller.ts - Chaotic import order
import { userSchema } from './schemas';
import type { Request, Response } from 'express';
import { findUserById } from './user.service';
import { z } from 'zod';
import { asyncHandler } from '../../../middleware/async-handler';
import type { User } from './types';
import express from 'express';
```

## ✅ CORRECT

```typescript
// user.controller.ts - Organized import order
// 1. External dependencies
import express from 'express';
import { z } from 'zod';

// 2. Express types
import type { Request, Response } from 'express';

// 3. Shared middleware/utilities
import { asyncHandler } from '../../../middleware/async-handler';

// 4. Feature-specific imports (services, schemas, types)
import { findUserById } from './user.service';
import { userSchema } from './schemas';
import type { User } from './types';
```

## Why This Matters

- **Readability**: Organized imports make dependencies immediately clear
- **Maintenance**: Easier to identify circular dependencies and missing imports
- **Consistency**: Teams can quickly navigate any file when structure is predictable
- **Code Review**: Changes to dependencies are easier to spot in diffs
- **IDE Performance**: Some tools perform better with organized imports

**Reference**: Many teams use ESLint's `import/order` rule to enforce this automatically.
