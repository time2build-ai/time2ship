# sec-authorize-middleware

Always implement proper authorization checks after authentication. Verify users have permission to access resources, not just that they're authenticated.

## ❌ WRONG

```typescript
// routes/posts.routes.ts - INSECURE
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';

const router = Router();

// Only checks authentication, not authorization
router.delete('/posts/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Any authenticated user can delete any post!
  await db.delete(posts).where(eq(posts.id, id));

  res.json({ success: true });
});

// No role checking
router.get('/admin/users', authenticate, async (req, res) => {
  // Any authenticated user can access admin endpoint!
  const allUsers = await db.select().from(users);
  res.json(allUsers);
});
```

## ✅ CORRECT

```typescript
// middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'Insufficient permissions',
        403 // Forbidden
      );
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const requireOwnership = (resourceType: 'post' | 'comment') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const resourceId = req.params.id;

    if (resourceType === 'post') {
      const [post] = await db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, resourceId))
        .limit(1);

      if (!post) {
        throw new AppError('Post not found', 404);
      }

      if (post.authorId !== req.user.id) {
        throw new AppError(
          'You do not have permission to modify this post',
          403
        );
      }
    }

    next();
  };
};

/**
 * Flexible policy-based authorization
 */
export const authorize = (
  policy: (req: Request) => boolean | Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const allowed = await policy(req);

    if (!allowed) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

// routes/posts.routes.ts - SECURE
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireOwnership, requireRole } from '@/middleware/authorize';
import { PostsController } from './posts.controller';

const router = Router();
const controller = new PostsController();

// Must be authenticated AND own the post
router.delete(
  '/posts/:id',
  authenticate,
  requireOwnership('post'),
  controller.deletePost
);

// Must be authenticated AND have admin role
router.get(
  '/admin/users',
  authenticate,
  requireRole('admin', 'superadmin'),
  controller.listUsers
);

// Complex authorization using policy
router.post(
  '/posts/:id/publish',
  authenticate,
  authorize(async (req) => {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, req.params.id),
    });

    // User must own post OR be an editor
    return (
      post?.authorId === req.user?.id ||
      req.user?.role === 'editor' ||
      req.user?.role === 'admin'
    );
  }),
  controller.publishPost
);

export default router;

// posts.service.ts - Defense in depth
export class PostsService {
  async deletePost(postId: string, userId: string): Promise<void> {
    // ALWAYS verify ownership in service layer too
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await db.delete(posts).where(eq(posts.id, postId));
  }
}
```

## Why This Matters

- **Security Impact**: Missing authorization checks allow authenticated users to access or modify resources they shouldn't, leading to data breaches and privilege escalation
- **OWASP Reference**: [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- **Authentication vs Authorization**: Authentication verifies WHO you are, Authorization verifies WHAT you can do. Both are required
- **Defense in Depth**: Implement authorization checks at both middleware and service layers. Never trust that middleware alone is sufficient
- **IDOR Prevention**: Insecure Direct Object Reference vulnerabilities occur when you don't verify ownership before operations
- **Role-Based Access Control (RBAC)**: Use roles for broad permissions (admin, user, guest)
- **Ownership-Based Access**: Verify user owns resource before allowing modifications
- **Policy-Based Access Control**: Combine multiple conditions (role + ownership + custom logic) for complex scenarios
