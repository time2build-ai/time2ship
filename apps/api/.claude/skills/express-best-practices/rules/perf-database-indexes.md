# perf-database-indexes

Add database indexes on columns frequently used in WHERE clauses, JOIN conditions, and ORDER BY statements to speed up queries from seconds to milliseconds.

## ❌ WRONG

```typescript
// BAD: No indexes on columns used for filtering
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postsTable = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull(), // Foreign key, no index
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // Filtered often, no index
  createdAt: timestamp('created_at').defaultNow(), // Sorted often, no index
});

// Slow query: Full table scan on postsTable
export async function getPublishedPostsByAuthor(authorId: string) {
  // Without indexes, this scans ALL posts
  return await db.query.posts.findMany({
    where: (posts, { eq, and }) =>
      and(
        eq(posts.authorId, authorId),
        eq(posts.status, 'published')
      ),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });
}
```

## ✅ CORRECT

```typescript
// GOOD: Add indexes for common query patterns
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(), // Unique index for lookups
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}));

export const postsTable = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Composite index for common query pattern
  authorStatusIdx: index('posts_author_status_idx')
    .on(table.authorId, table.status),
  // Index for sorting
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
  // Index for status filtering
  statusIdx: index('posts_status_idx').on(table.status),
}));

// Fast query: Uses indexes
export async function getPublishedPostsByAuthor(authorId: string) {
  // Uses posts_author_status_idx and posts_created_at_idx
  return await db.query.posts.findMany({
    where: (posts, { eq, and }) =>
      and(
        eq(posts.authorId, authorId),
        eq(posts.status, 'published')
      ),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });
}

// Migration file example
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createIndex('posts_author_status_idx')
    .on('posts')
    .columns(['author_id', 'status'])
    .execute();
}
```

## Why This Matters

- **Query Speed**: Indexes turn O(n) scans into O(log n) lookups
  - Without index: 1M rows = ~2000ms full table scan
  - With index: 1M rows = ~5ms indexed lookup
  - 400x performance improvement
- **Composite Indexes**: Order matters - `(authorId, status)` works for both `WHERE authorId` and `WHERE authorId AND status`
- **Index Strategy**:
  - Primary keys: Automatically indexed
  - Foreign keys: Always index for JOIN performance
  - Unique constraints: Create unique indexes
  - Filter columns: Index high-cardinality columns used in WHERE
  - Sort columns: Index columns in ORDER BY
- **Trade-offs**:
  - Indexes speed up reads but slow down writes (INSERT/UPDATE)
  - Each index adds storage overhead (~10-20% of table size)
  - Don't over-index; focus on actual query patterns
- **Monitoring**: Use `EXPLAIN ANALYZE` to verify index usage
- **Real Impact**: A single missing index can cause production outages when tables grow beyond test data size
