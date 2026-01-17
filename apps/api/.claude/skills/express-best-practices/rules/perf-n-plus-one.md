# perf-n-plus-one

Avoid N+1 query problems by using Drizzle's query API with relations to fetch associated data in a single query instead of making separate queries in loops.

## ❌ WRONG

```typescript
// N+1 problem: 1 query for posts + N queries for authors
export async function getPostsWithAuthors() {
  const posts = await db.select().from(postsTable);

  // BAD: Separate query for each post's author
  const postsWithAuthors = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      author: await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, post.authorId))
        .limit(1)
    }))
  );

  return postsWithAuthors;
}
```

## ✅ CORRECT

```typescript
// Use Drizzle query API with relations for efficient joins
export async function getPostsWithAuthors() {
  const postsWithAuthors = await db.query.posts.findMany({
    with: {
      author: true, // Single query with JOIN
    },
  });

  return postsWithAuthors;
}

// Alternative: Use explicit joins
export async function getPostsWithAuthorsExplicit() {
  const postsWithAuthors = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      content: postsTable.content,
      authorId: postsTable.authorId,
      authorName: usersTable.name,
      authorEmail: usersTable.email,
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id));

  return postsWithAuthors;
}
```

## Why This Matters

- **Performance Impact**: N+1 queries can cause 100+ database round trips instead of 1, increasing response time from ~50ms to 5000ms+
- **Database Load**: Each query has overhead; 100 small queries consume more resources than 1 optimized query
- **Scalability**: Problem compounds with data growth - 1000 posts = 1001 queries vs 1 query
- **Real-world Impact**: Common cause of production slowdowns, especially when data grows beyond test datasets
- **Detection**: Use database query logging to identify N+1 patterns during development
- **Drizzle Solutions**: Query API with `with` relations, explicit joins, or `db.$with()` CTEs all prevent N+1
