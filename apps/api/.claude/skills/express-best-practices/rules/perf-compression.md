# perf-compression

Enable gzip or brotli compression middleware to reduce response payload sizes by 70-90%, dramatically improving response times especially for clients on slow networks.

## ❌ WRONG

```typescript
// BAD: No compression - sending raw JSON responses
import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/posts', async (req, res) => {
  const posts = await db.query.posts.findMany({
    with: { author: true, comments: true },
  });

  // Sending uncompressed 500KB JSON response
  res.json({ posts });
});

app.listen(3000);
```

## ✅ CORRECT

```typescript
// GOOD: Enable compression for all responses
import express from 'express';
import compression from 'compression';

const app = express();

// Enable compression middleware (gzip/deflate)
app.use(compression({
  level: 6,              // Compression level (0-9, 6 is default balance)
  threshold: 1024,       // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },
}));

app.use(express.json());

app.get('/api/posts', async (req, res) => {
  const posts = await db.query.posts.findMany({
    with: { author: true, comments: true },
  });

  // Response automatically compressed (500KB → 75KB)
  res.json({ posts });
});

app.listen(3000);

// BETTER: Use brotli for even better compression (Node.js 12+)
import { createBrotliCompress } from 'zlib';
import expressCompression from 'express-compression';

app.use(expressCompression({
  brotli: {
    enabled: true,
    zlib: createBrotliCompress,
  },
}));
```

## Why This Matters

- **Bandwidth Reduction**:
  - JSON responses typically compress 70-90%
  - 500KB response → 50-75KB compressed
  - Massive savings for repeated API calls
- **Response Time**:
  - Uncompressed 500KB on 3G: ~3000ms transfer
  - Compressed 75KB on 3G: ~450ms transfer
  - 85% faster for mobile users
- **Compression Comparison**:
  - **gzip**: 70-80% reduction, fast compression, universal support
  - **brotli**: 80-90% reduction, slower compression but better ratio, modern browser support
  - **deflate**: Older, less effective
- **CPU vs Network Trade-off**:
  - Compression CPU cost: ~5-20ms per request
  - Network savings: 500-2500ms on slow connections
  - Almost always worth it
- **Best Practices**:
  - Only compress responses > 1KB (threshold)
  - Don't compress images/video (already compressed)
  - Use level 6 (default) for balance
  - Level 9 = 2% better compression, 3x slower
- **Caching**: Compressed responses can be cached at CDN/proxy level
- **Headers**: Middleware handles `Content-Encoding` and `Vary` headers automatically
