# Express Best Practices Skill Design

**Date**: 2026-01-16
**Author**: Brainstorming session with Thiago
**Purpose**: Comprehensive best practices skill for Express/TypeScript API development with security-first approach

---

## Overview

The **Express Best Practices** skill provides security, performance, and architecture guidelines for production-ready Express/TypeScript APIs. Modeled after the React best practices skill but tailored for backend API development.

**Key Characteristics:**
- **Security-first**: Critical priority on preventing vulnerabilities
- **Strict enforcement**: Rules enforce existing architecture.md patterns
- **Balanced coverage**: Security, performance, and architecture
- **~35 rules**: Comprehensive but focused scope
- **Code examples**: Every rule has ❌ WRONG and ✅ CORRECT examples

---

## Priority Hierarchy

Rules are prioritized by impact on production readiness and security:

1. **CRITICAL** - Security vulnerabilities (auth, validation, injection attacks)
2. **HIGH** - Performance bottlenecks (database queries, caching, response optimization)
3. **MEDIUM** - Architecture violations (layering, type safety, error handling)
4. **LOW** - Code quality refinements (naming, imports, consistency)

---

## Rule Categories

### 1. Security (CRITICAL Priority) - `sec-` prefix

**12 rules covering authentication, authorization, input validation, and attack prevention**

#### Authentication & Authorization (4 rules)
- `sec-auth-jwt-secret` - Use strong JWT secrets, rotate regularly, never hardcode
- `sec-auth-password-hashing` - Use bcrypt/argon2, never plain text, proper salt rounds
- `sec-auth-token-expiry` - Set reasonable JWT expiration, implement refresh tokens
- `sec-authorize-middleware` - Check permissions after authentication, fail closed

#### Input Validation & Sanitization (4 rules)
- `sec-input-validation-zod` - Validate ALL inputs with Zod at route boundaries
- `sec-sql-injection-drizzle` - Use Drizzle query builder, NEVER raw SQL or string concatenation
- `sec-xss-prevention` - Sanitize outputs, set Content-Security-Policy headers
- `sec-path-traversal` - Validate file paths, use allowlists for file operations

#### Secrets & Configuration (2 rules)
- `sec-secrets-env` - Use environment variables, never commit secrets, validate on startup
- `sec-error-leakage` - Sanitize error messages in production, log full errors server-side

#### Attack Prevention (2 rules)
- `sec-rate-limiting` - Implement rate limiting per IP/user for auth endpoints
- `sec-cors-config` - Configure CORS properly, don't use `origin: '*'` in production

---

### 2. Performance (HIGH Priority) - `perf-` prefix

**10 rules covering database, caching, and response optimization**

#### Database Optimization (4 rules)
- `perf-n-plus-one` - Use joins or `findMany` with relations, avoid query loops
- `perf-connection-pooling` - Configure Drizzle/Postgres pool size, handle connection limits
- `perf-select-specific` - Select only needed columns, not `SELECT *`
- `perf-database-indexes` - Add indexes for frequently queried columns (WHERE, JOIN, ORDER BY)

#### Response Optimization (3 rules)
- `perf-compression` - Enable gzip/brotli compression for JSON responses
- `perf-pagination` - Implement cursor/offset pagination for list endpoints
- `perf-streaming` - Use streams for large file downloads/uploads

#### Caching Strategies (3 rules)
- `perf-cache-headers` - Set Cache-Control headers for cacheable endpoints
- `perf-response-caching` - Cache expensive computed responses (Redis/in-memory)
- `perf-avoid-blocking` - Don't await non-critical operations (logging, analytics)

---

### 3. Architecture (MEDIUM Priority) - `arch-` prefix

**8 rules enforcing feature-based architecture patterns**

#### Layer Separation (3 rules)
- `arch-no-business-in-routes` - Routes must be thin, only HTTP concerns, call services
- `arch-no-db-in-routes` - Routes cannot import db/schemas, must go through services
- `arch-services-throw-errors` - Services throw errors, never return error objects

#### Type Safety (3 rules)
- `arch-no-any-types` - Forbidden: use `unknown`, proper types, or generics instead
- `arch-explicit-return-types` - All functions must have explicit return type annotations
- `arch-type-inference-zod` - Infer types from Zod schemas, don't duplicate

#### Error Handling (2 rules)
- `arch-async-handler-wrapper` - Wrap async route handlers to catch promise rejections
- `arch-custom-error-classes` - Use AppError subclasses with status codes, not generic Error

---

### 4. Code Quality (LOW Priority) - `quality-` prefix

**5 rules enforcing consistency and maintainability**

- `quality-import-order` - Follow order: external → internal (@/) → relative → types
- `quality-naming-conventions` - kebab-case files, camelCase vars, PascalCase classes
- `quality-no-magic-values` - Use constants for roles, statuses, config values
- `quality-feature-structure` - Enforce routes/services/validators/schemas folder structure
- `quality-barrel-exports` - Avoid barrel files, export from feature index only

---

## File Structure

```
apps/api/.claude/skills/express-best-practices/
├── SKILL.md                    # Overview, quick reference, when to use
├── AGENTS.md                   # Full compiled document for agents
└── rules/
    ├── _sections.md            # Section dividers for compilation
    │
    ├── sec-auth-jwt-secret.md
    ├── sec-auth-password-hashing.md
    ├── sec-auth-token-expiry.md
    ├── sec-authorize-middleware.md
    ├── sec-input-validation-zod.md
    ├── sec-sql-injection-drizzle.md
    ├── sec-xss-prevention.md
    ├── sec-path-traversal.md
    ├── sec-secrets-env.md
    ├── sec-error-leakage.md
    ├── sec-rate-limiting.md
    ├── sec-cors-config.md
    │
    ├── perf-n-plus-one.md
    ├── perf-connection-pooling.md
    ├── perf-select-specific.md
    ├── perf-database-indexes.md
    ├── perf-compression.md
    ├── perf-pagination.md
    ├── perf-streaming.md
    ├── perf-cache-headers.md
    ├── perf-response-caching.md
    ├── perf-avoid-blocking.md
    │
    ├── arch-no-business-in-routes.md
    ├── arch-no-db-in-routes.md
    ├── arch-services-throw-errors.md
    ├── arch-no-any-types.md
    ├── arch-explicit-return-types.md
    ├── arch-type-inference-zod.md
    ├── arch-async-handler-wrapper.md
    ├── arch-custom-error-classes.md
    │
    ├── quality-import-order.md
    ├── quality-naming-conventions.md
    ├── quality-no-magic-values.md
    ├── quality-feature-structure.md
    └── quality-barrel-exports.md
```

---

## Rule File Format

Each rule file follows this structure (matching React skill format):

```markdown
# rule-name

Brief explanation of the issue (1-2 sentences)

## ❌ WRONG

\`\`\`typescript
// Bad code example demonstrating the anti-pattern
// Inline comments explaining what's wrong
\`\`\`

## ✅ CORRECT

\`\`\`typescript
// Good code example showing proper implementation
// Inline comments explaining why it's better
\`\`\`

## Why This Matters

Additional context:
- Security implications or performance impact
- Common mistakes developers make
- References (OWASP, documentation, benchmarks)
- When to apply this rule
```

**Example for `sec-sql-injection-drizzle.md`:**

```markdown
# sec-sql-injection-drizzle

Never concatenate user input into SQL queries. Always use Drizzle's query builder with parameterized queries to prevent SQL injection attacks.

## ❌ WRONG

\`\`\`typescript
// Vulnerable to SQL injection
async function findUser(email: string): Promise<User | null> {
  const query = \`SELECT * FROM users WHERE email = '\${email}'\`;
  const result = await db.execute(query);
  return result[0] || null;
}

// Attacker can pass: admin@example.com' OR '1'='1
\`\`\`

## ✅ CORRECT

\`\`\`typescript
import { db } from '@/config/database';
import { users } from '../schemas/user.schema';
import { eq } from 'drizzle-orm';

async function findUser(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

// Drizzle automatically parameterizes queries
// User input is safely escaped
\`\`\`

## Why This Matters

SQL injection is the #1 web application vulnerability (OWASP Top 10). Even a single vulnerable query can lead to complete database compromise, data theft, or deletion.

**Common mistakes:**
- Using template literals with user input
- Calling \`db.execute()\` with string concatenation
- Trusting "sanitized" input from frontend

**References:**
- OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
- Drizzle Security: https://orm.drizzle.team/docs/security
```

---

## SKILL.md Structure

The main skill file will have:

### Header
```yaml
---
name: express-best-practices
description: Express and TypeScript API security, performance, and architecture guidelines. Use when writing, reviewing, or refactoring Express/TypeScript code to ensure production-ready, secure, and optimized patterns. Triggers on tasks involving API routes, database queries, authentication, or performance optimization.
license: MIT
metadata:
  author: time2ship
  version: "1.0.0"
---
```

### Quick Reference Table

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Security | CRITICAL | `sec-` | 12 |
| 2 | Performance | HIGH | `perf-` | 10 |
| 3 | Architecture | MEDIUM | `arch-` | 8 |
| 4 | Code Quality | LOW | `quality-` | 5 |

### When to Apply

List of automatic triggers:
- Writing new Express routes, services, or validators
- Implementing authentication/authorization
- Adding database queries or schemas
- Reviewing code for security vulnerabilities
- Refactoring existing API code
- Optimizing slow endpoints
- Fixing production issues

### Category Summaries

Brief 2-3 sentence summaries of each category with most important rules listed.

### Full Rule List

Organized by category with rule names and one-line descriptions.

### Usage Instructions

How to read individual rule files and apply them during development.

---

## AGENTS.md Structure

Compiled document with all rules expanded inline for AI agents to reference. Structure:

1. Overview and priority system
2. Security rules (all 12 expanded with code examples)
3. Performance rules (all 10 expanded)
4. Architecture rules (all 8 expanded)
5. Code Quality rules (all 5 expanded)
6. Summary checklist

This allows agents to search/read the full context without loading 35+ individual files.

---

## Integration with Existing Architecture

### Relationship to architecture.md

The Express Best Practices skill:
- **Enforces** patterns documented in [architecture.md](../../apps/api/.claude/references/architecture.md)
- **Provides code examples** for abstract guidelines
- **Catches violations** through specific, checkable rules
- **Extends** with security and performance best practices

### Key Differences

| Architecture.md | Express Best Practices Skill |
|----------------|------------------------------|
| Guidelines ("should") | Rules ("must") |
| Text descriptions | Code examples |
| Architecture patterns | Tactical implementations |
| Feature organization | Security, performance, quality |

### Complementary Usage

- **Architecture.md** = System design reference
- **Express Best Practices** = Code-level enforcement

Both should be consulted together when building new features.

---

## Usage Scenarios

### Scenario 1: Writing New Feature
Developer creates `features/payments/`:
1. Consult architecture.md for folder structure
2. Apply express-best-practices rules:
   - `sec-input-validation-zod` for payment data
   - `arch-no-business-in-routes` for route handlers
   - `perf-select-specific` for payment queries
   - `quality-feature-structure` for folder organization

### Scenario 2: Security Review
Reviewing authentication implementation:
1. Check all `sec-auth-*` rules
2. Verify `sec-input-validation-zod` on auth endpoints
3. Confirm `sec-rate-limiting` is applied
4. Validate `sec-secrets-env` for JWT secrets

### Scenario 3: Performance Optimization
Slow endpoint identified:
1. Check `perf-n-plus-one` for database queries
2. Apply `perf-select-specific` to reduce data transfer
3. Implement `perf-pagination` for large result sets
4. Add `perf-cache-headers` for repeated requests

### Scenario 4: Code Review
Pull request review checklist:
1. Run through all CRITICAL security rules
2. Check for architecture violations (arch-*)
3. Verify performance patterns (perf-*)
4. Validate code quality standards (quality-*)

---

## Success Criteria

This skill is successful if it:

1. **Prevents security vulnerabilities** - No SQL injection, XSS, auth bypasses in production
2. **Enforces architecture** - All code follows feature-based patterns
3. **Improves performance** - No N+1 queries, proper caching, optimized responses
4. **Maintains consistency** - Uniform code style across all features
5. **Developer adoption** - Team references it during development and reviews

---

## Implementation Checklist

- [ ] Create skill directory structure
- [ ] Write SKILL.md with overview and quick reference
- [ ] Write all 12 security rule files
- [ ] Write all 10 performance rule files
- [ ] Write all 8 architecture rule files
- [ ] Write all 5 code quality rule files
- [ ] Create _sections.md for compilation
- [ ] Compile AGENTS.md from all rules
- [ ] Update apps/api/.claude/CLAUDE.md to reference skill
- [ ] Test skill with sample violations
- [ ] Add to team documentation

---

## Future Enhancements

Potential additions after v1.0:

- **Testing rules** - Unit test patterns, mocking strategies, test coverage
- **Observability** - Logging, metrics, tracing best practices
- **Deployment** - Docker, CI/CD, health checks, graceful shutdown
- **Advanced patterns** - Event-driven architecture, CQRS, microservices integration

These can be added as separate rule categories or new skills depending on scope.

---

## Version History

- **v1.0** (2026-01-16) - Initial design with 35 rules across 4 categories

---

**Status**: Design complete, ready for implementation
