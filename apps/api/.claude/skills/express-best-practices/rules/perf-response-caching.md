# perf-response-caching

Implement server-side caching (Redis, in-memory) for expensive operations like complex database queries or external API calls to avoid redundant computation.

## ❌ WRONG

```typescript
// BAD: Expensive query runs on every request
export async function getDashboardStats(req: Request, res: Response) {
  // Complex aggregation - takes 5 seconds
  const stats = await db
    .select({
      totalUsers: sql<number>`count(distinct ${usersTable.id})`,
      totalPosts: sql<number>`count(distinct ${postsTable.id})`,
      avgPostsPerUser: sql<number>`count(${postsTable.id})::float / nullif(count(distinct ${usersTable.id}), 0)`,
      topAuthors: sql<any>`json_agg(distinct jsonb_build_object('name', ${usersTable.name}, 'posts', count(${postsTable.id})))`,
    })
    .from(usersTable)
    .leftJoin(postsTable, eq(postsTable.authorId, usersTable.id));

  // Runs every time - 5 second response time
  res.json({ stats });
}

// BAD: External API call on every request
export async function getWeatherData(req: Request, res: Response) {
  // Third-party API call - costs money, takes 2 seconds
  const weather = await fetch('https://api.weather.com/data');
  const data = await weather.json();

  // No caching - expensive and slow
  res.json(data);
}
```

## ✅ CORRECT

```typescript
// GOOD: In-memory caching for simple cases
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,          // Default TTL: 5 minutes
  checkperiod: 60,      // Check for expired keys every 60s
  useClones: false,     // Performance optimization
});

export async function getDashboardStats(req: Request, res: Response) {
  const cacheKey = 'dashboard:stats';

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ stats: cached });
  }

  // Cache miss - compute stats
  const stats = await db
    .select({
      totalUsers: sql<number>`count(distinct ${usersTable.id})`,
      totalPosts: sql<number>`count(distinct ${postsTable.id})`,
      avgPostsPerUser: sql<number>`count(${postsTable.id})::float / nullif(count(distinct ${usersTable.id}), 0)`,
    })
    .from(usersTable)
    .leftJoin(postsTable, eq(postsTable.authorId, usersTable.id));

  // Store in cache
  cache.set(cacheKey, stats, 300); // Cache for 5 minutes

  res.setHeader('X-Cache', 'MISS');
  res.json({ stats });
}

// BETTER: Redis caching for distributed systems
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

export async function getUserProfile(req: Request, res: Response) {
  const { userId } = req.params;
  const cacheKey = `user:profile:${userId}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ user: JSON.parse(cached) });
  }

  // Cache miss - fetch from database
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    with: {
      posts: { limit: 10 },
      followers: { limit: 100 },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Cache for 10 minutes
  await redis.setEx(cacheKey, 600, JSON.stringify(user));

  res.setHeader('X-Cache', 'MISS');
  res.json({ user });
}

// BEST: Cache middleware with invalidation
interface CacheOptions {
  ttl: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if condition not met
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : `${req.method}:${req.originalUrl}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      // Cache the response
      redis.setEx(cacheKey, options.ttl, JSON.stringify(body))
        .catch(err => console.error('Cache write error:', err));

      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

// Usage with cache invalidation
app.get('/api/posts/:id',
  cacheMiddleware({
    ttl: 3600,
    keyGenerator: (req) => `post:${req.params.id}`,
  }),
  getPost
);

// Invalidate cache on update
export async function updatePost(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body;

  const updatedPost = await db
    .update(postsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(postsTable.id, id))
    .returning();

  // Invalidate cache
  await redis.del(`post:${id}`);
  await redis.del('posts:list'); // Invalidate list cache too

  res.json({ post: updatedPost[0] });
}

// ADVANCED: Cache warming and preloading
export async function warmCache() {
  console.log('Warming cache...');

  // Preload popular posts
  const popularPosts = await db.query.posts.findMany({
    where: (posts, { gte }) =>
      gte(posts.viewCount, 1000),
    limit: 100,
  });

  for (const post of popularPosts) {
    const cacheKey = `post:${post.id}`;
    await redis.setEx(cacheKey, 3600, JSON.stringify(post));
  }

  console.log(`Warmed cache with ${popularPosts.length} popular posts`);
}

// Run cache warming on startup
warmCache().catch(console.error);
```

## Why This Matters

- **Response Time**:
  - Without cache: 5000ms complex query
  - With cache: 5ms Redis lookup
  - 1000x faster response
- **Database Load**:
  - 1000 req/min without cache = 1000 complex queries
  - 1000 req/min with 5min cache = ~4 queries
  - 99.6% reduction in database load
- **Cost Savings**: Caching external APIs prevents redundant paid calls
- **Scalability**: In-memory cache works for single server; Redis required for multi-server deployments
- **Cache Strategies**:
  - **Cache-aside**: Check cache, if miss fetch and populate (most common)
  - **Write-through**: Update cache on every write
  - **Write-behind**: Async cache updates
  - **Refresh-ahead**: Proactively refresh before expiry
- **TTL Guidelines**:
  - Dashboard stats: 5-15 minutes
  - User profiles: 5-10 minutes
  - Public posts: 1-24 hours
  - Real-time data: 30-60 seconds
  - External APIs: Based on data freshness requirements
- **Invalidation Strategies**:
  - **Time-based**: Set TTL, let expire naturally
  - **Event-based**: Invalidate on updates/deletes
  - **Pattern-based**: Invalidate groups of keys (e.g., `del user:123:*`)
- **Cache Key Design**:
  - Include resource type and ID: `user:profile:123`
  - Include query params for filtered results: `posts:list:page:1:limit:20`
  - Use consistent naming convention
- **Monitoring**: Track cache hit rate (aim for >80% for effective caching)
