# perf-pagination

Always paginate large result sets using limit/offset or cursor-based pagination to prevent loading thousands of rows into memory and causing timeouts or crashes.

## ❌ WRONG

```typescript
// BAD: Loading all records at once
export async function getAllPosts() {
  // Loads 100,000 posts into memory - causes OOM crashes
  const posts = await db.query.posts.findMany({
    with: { author: true },
  });

  return posts; // 50MB+ response
}

// BAD: Client-side pagination only
export async function getPostsClientPagination(req: Request, res: Response) {
  // Still loads all posts from database
  const allPosts = await db.select().from(postsTable);

  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  // Pagination happens in app, not database
  const paginatedPosts = allPosts.slice((page - 1) * limit, page * limit);

  res.json({ posts: paginatedPosts });
}
```

## ✅ CORRECT

```typescript
// GOOD: Offset-based pagination (simple, works for most cases)
export interface PaginationParams {
  page: number;
  limit: number;
}

export async function getPostsPaginated(params: PaginationParams) {
  const { page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  // Fetch only one page of results
  const posts = await db.query.posts.findMany({
    limit,
    offset,
    with: { author: true },
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });

  // Get total count for pagination metadata
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postsTable);

  return {
    posts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1,
    },
  };
}

// BETTER: Cursor-based pagination (for real-time feeds, better performance)
export interface CursorPaginationParams {
  cursor?: string; // Last seen post ID
  limit: number;
}

export async function getPostsCursorPaginated(params: CursorPaginationParams) {
  const { cursor, limit = 20 } = params;

  const posts = await db.query.posts.findMany({
    limit: limit + 1, // Fetch one extra to know if there's more
    where: cursor
      ? (posts, { lt }) => lt(posts.createdAt, new Date(cursor))
      : undefined,
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    with: { author: true },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;

  return {
    posts: items,
    pagination: {
      nextCursor: hasMore
        ? items[items.length - 1].createdAt.toISOString()
        : null,
      hasMore,
    },
  };
}

// GOOD: Express route with validation
import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getPostsHandler(req: Request, res: Response) {
  const params = paginationSchema.parse(req.query);
  const result = await getPostsPaginated(params);

  res.json(result);
}
```

## Why This Matters

- **Memory**: Loading 100K posts = 50MB+ in memory; paginated = 500KB max
- **Performance**:
  - All records: 5000ms query + 2000ms serialization
  - Paginated: 50ms query + 20ms serialization
  - 100x faster response time
- **Database**: LIMIT/OFFSET prevents full table scans
- **Offset vs Cursor**:
  - **Offset**: Simpler, allows jumping to pages, but slow for high offsets (OFFSET 10000 scans 10000 rows)
  - **Cursor**: Faster, consistent performance, works for real-time feeds, but can't jump to arbitrary pages
- **Best Practices**:
  - Default limit: 20-50 items
  - Max limit: 100 items (prevent abuse)
  - Always validate and sanitize pagination params
  - Include pagination metadata in response
  - Use cursor pagination for feeds/timelines
  - Use offset pagination for browsing/search
- **Indexing**: Pagination requires indexes on ORDER BY columns for performance
- **Total Count**: Counting large tables is expensive; consider omitting total on huge datasets or caching count
