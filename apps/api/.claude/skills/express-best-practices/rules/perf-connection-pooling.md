# perf-connection-pooling

Configure database connection pooling properly to reuse connections instead of creating new ones for every request, reducing connection overhead and improving throughput.

## ❌ WRONG

```typescript
// BAD: Creating new connection for every request
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function getUserById(id: string) {
  // Creates new connection every time
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
  });

  await client.end(); // Closes connection
  return user;
}
```

## ✅ CORRECT

```typescript
// GOOD: Configure connection pool once, reuse across requests
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection pool once (singleton pattern)
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,                    // Maximum pool size
  idle_timeout: 20,           // Close idle connections after 20s
  connect_timeout: 10,        // Connection timeout in seconds
  max_lifetime: 60 * 30,      // Recycle connections after 30 minutes
});

export const db = drizzle(client, { schema });

// Use the pooled connection in services
export async function getUserById(id: string) {
  // Reuses connection from pool
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
  });

  return user;
  // Connection automatically returned to pool
}

// Graceful shutdown
export async function closeDatabase() {
  await client.end();
}
```

## Why This Matters

- **Performance**: Creating new connections costs 20-100ms each; pooling reduces this to <1ms
- **Throughput**: Without pooling, max concurrent requests = max DB connections; with pooling, handle 1000s of requests with 10 connections
- **Resource Usage**: Each PostgreSQL connection uses ~10MB RAM; pooling prevents connection exhaustion
- **Benchmarks**:
  - No pooling: ~50 req/sec with high latency spikes
  - With pooling (10 connections): ~500 req/sec with consistent low latency
- **Production**: Connection limits are real - Heroku Postgres allows 20 connections on basic tier
- **Configuration**: Tune `max` based on `(core_count * 2) + effective_spindle_count` and available connections
