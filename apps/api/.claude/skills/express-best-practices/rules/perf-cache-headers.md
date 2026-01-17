# perf-cache-headers

Set appropriate Cache-Control and ETag headers to enable browser and CDN caching, reducing server load and improving client-side performance.

## ❌ WRONG

```typescript
// BAD: No caching headers - every request hits server
export async function getPublicPost(req: Request, res: Response) {
  const { id } = req.params;

  const post = await db.query.posts.findFirst({
    where: (posts, { eq }) => eq(posts.id, id),
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // No cache headers - browser re-fetches every time
  res.json({ post });
}

// BAD: Static files without caching
app.use('/uploads', express.static('uploads'));
// Files re-downloaded every page load
```

## ✅ CORRECT

```typescript
// GOOD: Cache public, immutable content aggressively
export async function getPublicPost(req: Request, res: Response) {
  const { id } = req.params;

  const post = await db.query.posts.findFirst({
    where: (posts, { eq }) => eq(posts.id, id),
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Cache for 1 hour, allow CDN caching
  res.setHeader('Cache-Control', 'public, max-age=3600');

  // ETag for conditional requests
  const etag = `"${post.id}-${post.updatedAt.getTime()}"`;
  res.setHeader('ETag', etag);

  // Check if client has fresh version
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }

  res.json({ post });
}

// GOOD: Cache static assets with long expiry
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',           // Cache for 1 year
  immutable: true,        // Content never changes
  etag: true,             // Enable ETag
  lastModified: true,     // Enable Last-Modified
}));

// GOOD: Different caching strategies per route type
import { cacheControl } from './middleware/cacheControl';

// Public, static content - cache aggressively
app.get('/api/posts/:id',
  cacheControl({ public: true, maxAge: 3600 }),
  getPublicPost
);

// User-specific content - cache privately
app.get('/api/users/me',
  authenticateUser,
  cacheControl({ private: true, maxAge: 300 }),
  getCurrentUser
);

// Frequently changing content - short cache + revalidation
app.get('/api/posts/feed',
  cacheControl({ public: true, maxAge: 60, mustRevalidate: true }),
  getPostFeed
);

// Sensitive content - no caching
app.get('/api/admin/users',
  authorizeAdmin,
  cacheControl({ noStore: true }),
  getAdminUsers
);

// Middleware implementation
interface CacheOptions {
  public?: boolean;
  private?: boolean;
  maxAge?: number;      // seconds
  sMaxAge?: number;     // CDN cache time
  noStore?: boolean;
  noCache?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

export function cacheControl(options: CacheOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parts: string[] = [];

    if (options.public) parts.push('public');
    if (options.private) parts.push('private');
    if (options.noStore) parts.push('no-store');
    if (options.noCache) parts.push('no-cache');
    if (options.mustRevalidate) parts.push('must-revalidate');
    if (options.immutable) parts.push('immutable');

    if (options.maxAge !== undefined) {
      parts.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge !== undefined) {
      parts.push(`s-maxage=${options.sMaxAge}`);
    }

    res.setHeader('Cache-Control', parts.join(', '));
    next();
  };
}

// GOOD: Conditional request support
import crypto from 'crypto';

export function withETag(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      // Generate ETag from response body
      const etag = `"${crypto
        .createHash('md5')
        .update(JSON.stringify(body))
        .digest('hex')}"`;

      res.setHeader('ETag', etag);

      // Check if client has fresh version
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      return originalJson(body);
    };

    return handler(req, res, next);
  };
}
```

## Why This Matters

- **Server Load Reduction**:
  - Without caching: 1000 requests/min = 1000 database queries
  - With 1-hour cache: 1000 requests/min = ~17 database queries
  - 98% reduction in server load
- **Performance**:
  - Server round trip: 200-500ms
  - Browser cache hit: <1ms
  - 200-500x faster response
- **Bandwidth Savings**:
  - 304 Not Modified responses: ~200 bytes
  - Full JSON response: 10-100KB
  - 50-500x bandwidth reduction
- **CDN Benefits**: `public` + `max-age` enables CDN caching, serving content from edge locations
- **Cache Strategies**:
  - **Immutable static assets**: `max-age=31536000, immutable` (1 year)
  - **Public content**: `public, max-age=3600` (1 hour)
  - **Private user data**: `private, max-age=300` (5 min)
  - **Real-time data**: `public, max-age=60, must-revalidate` (1 min)
  - **Sensitive data**: `no-store, no-cache` (never cache)
- **ETag Benefits**:
  - Enables conditional requests (If-None-Match)
  - Prevents serving stale content
  - Saves bandwidth even when content changes
- **Best Practices**:
  - Use ETags for dynamic content
  - Use versioned URLs for static assets (`/static/app.v123.js`)
  - Set `Vary` header when response varies by header
  - Use `private` for user-specific content
  - Use `s-maxage` for different CDN cache times
