# arch-no-db-in-routes

Routes MUST NOT access the database directly. All database operations belong in the service layer.

## ❌ WRONG

```typescript
// features/posts/routes/post.routes.ts
import { db } from '@/config/database';
import { posts } from '../schemas/post.schema';
import { eq } from 'drizzle-orm';

router.get('/posts/:id', async (req, res) => {
  // Direct database access from route - WRONG!
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, req.params.id),
    with: {
      author: true,
      comments: true
    }
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json({ success: true, data: post });
});

router.delete('/posts/:id', async (req, res) => {
  // More direct database access - WRONG!
  await db.delete(posts).where(eq(posts.id, req.params.id));
  res.status(204).send();
});
```

## ✅ CORRECT

```typescript
// features/posts/routes/post.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/async-handler';
import { postService } from '../services/post.service';

const router = Router();

router.get('/posts/:id', asyncHandler(async (req, res) => {
  // Route delegates to service
  const post = await postService.findById(req.params.id);
  res.json({ success: true, data: post });
}));

router.delete('/posts/:id', asyncHandler(async (req, res) => {
  // Route delegates to service
  await postService.deleteById(req.params.id);
  res.status(204).send();
}));

export default router;

// features/posts/services/post.service.ts
import { db } from '@/config/database';
import { posts } from '../schemas/post.schema';
import { eq } from 'drizzle-orm';
import { PostNotFoundError } from '../errors/post.errors';
import type { Post } from '../types/post.types';

export const postService = {
  async findById(id: string): Promise<Post> {
    // Database access is encapsulated in service
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        comments: true
      }
    });

    if (!post) {
      throw new PostNotFoundError(id);
    }

    return post;
  },

  async deleteById(id: string): Promise<void> {
    // All database operations in service layer
    const result = await db.delete(posts)
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      throw new PostNotFoundError(id);
    }
  }
};
```

## Why This Matters

- **Layer Separation**: Routes handle HTTP, services handle data access
- **Testability**: Database operations can be mocked at service boundary
- **Error Handling**: Services throw typed errors, routes convert to HTTP responses
- **Transaction Management**: Services can coordinate multi-table operations with transactions
- **Query Optimization**: Database logic is centralized and easier to optimize
- **Reusability**: Same database operations available to multiple routes or consumers
- **Security**: Database access patterns are controlled and auditable in one place

Routes must NEVER:
- Import `db` from database config
- Import schema definitions for queries
- Use Drizzle query builder
- Perform any database operations

Reference: [Architecture Guidelines - Rules](../../../references/architecture.md#layering--responsibilities)
