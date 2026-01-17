# sec-sql-injection-drizzle

Always use Drizzle's query builder with parameterized queries. Never concatenate user input into raw SQL strings, even with Drizzle's sql operator.

## ❌ WRONG

```typescript
// users.service.ts - SQL INJECTION VULNERABILITY
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export class UsersService {
  // CRITICAL: String concatenation in raw SQL
  async searchUsers(searchTerm: string) {
    // Attacker could inject: "'; DROP TABLE users; --"
    return db.execute(
      sql.raw(`SELECT * FROM users WHERE name LIKE '%${searchTerm}%'`)
    );
  }

  // WRONG: Template literal with user input
  async getUserByEmail(email: string) {
    // Vulnerable to SQL injection
    return db.execute(
      sql`SELECT * FROM users WHERE email = '${email}'`
    );
  }

  // WRONG: Dynamic column/table names from user input
  async sortUsers(sortColumn: string, order: string) {
    // Attacker could inject malicious column names
    return db.execute(
      sql.raw(`SELECT * FROM users ORDER BY ${sortColumn} ${order}`)
    );
  }
}
```

## ✅ CORRECT

```typescript
// users.service.ts - SECURE
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, sql, asc, desc } from 'drizzle-orm';

export class UsersService {
  /**
   * Search users using parameterized queries
   */
  async searchUsers(searchTerm: string) {
    // Drizzle automatically parameterizes the value
    return db
      .select()
      .from(users)
      .where(
        or(
          like(users.name, `%${searchTerm}%`),
          like(users.email, `%${searchTerm}%`)
        )
      );
  }

  /**
   * Get user by email with parameterized query
   */
  async getUserByEmail(email: string) {
    // The eq() operator safely parameterizes the value
    return db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
  }

  /**
   * Sort users with whitelisted columns
   */
  async sortUsers(
    sortColumn: 'name' | 'email' | 'createdAt',
    order: 'asc' | 'desc'
  ) {
    // Whitelist allowed columns using type system
    const columnMap = {
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    };

    const column = columnMap[sortColumn];
    const orderFn = order === 'asc' ? asc : desc;

    return db
      .select()
      .from(users)
      .orderBy(orderFn(column));
  }

  /**
   * If raw SQL is absolutely necessary, use sql.placeholder()
   */
  async complexQuery(userId: string, status: string) {
    // Use placeholders for user input
    return db.execute(
      sql`
        SELECT u.*, COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        WHERE u.id = ${sql.placeholder('userId')}
          AND u.status = ${sql.placeholder('status')}
        GROUP BY u.id
      `,
      { userId, status } // Parameters passed separately
    );
  }

  /**
   * Full-text search with proper escaping
   */
  async fullTextSearch(query: string) {
    // Use Drizzle's sql operator with parameterization
    return db
      .select()
      .from(users)
      .where(
        sql`to_tsvector('english', ${users.name} || ' ' || ${users.bio})
            @@ plainto_tsquery('english', ${query})`
      );
  }

  /**
   * Dynamic WHERE conditions built safely
   */
  async filterUsers(filters: {
    email?: string;
    status?: string;
    minAge?: number;
  }) {
    const conditions = [];

    if (filters.email) {
      conditions.push(eq(users.email, filters.email));
    }

    if (filters.status) {
      conditions.push(eq(users.status, filters.status));
    }

    if (filters.minAge) {
      conditions.push(sql`${users.age} >= ${filters.minAge}`);
    }

    return db
      .select()
      .from(users)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);
  }
}
```

## Why This Matters

- **Security Impact**: SQL injection allows attackers to execute arbitrary SQL commands, leading to data theft, data manipulation, authentication bypass, and complete system compromise
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/)
- **Drizzle Protection**: Query builder methods (eq, like, gt, etc.) automatically parameterize values, making SQL injection impossible
- **Raw SQL Danger**: Even with Drizzle, using sql.raw() or template literals with user input creates vulnerabilities
- **Whitelist Approach**: For dynamic column names or table names, use a whitelist/map of allowed values rather than accepting user input directly
- **sql.placeholder()**: When raw SQL is necessary, use placeholders to separate SQL structure from data
- **Common Mistake**: Developers sometimes think ORMs prevent all SQL injection, but improper use of raw SQL features can still create vulnerabilities
- **Defense in Depth**: Combine parameterized queries with input validation (see sec-input-validation-zod.md) and principle of least privilege database permissions
