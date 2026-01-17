---
name: express-best-practices
description: Express and TypeScript API security, performance, and architecture guidelines. Use when writing, reviewing, or refactoring Express/TypeScript code to ensure production-ready, secure, and optimized patterns. Triggers on tasks involving API routes, database queries, authentication, or performance optimization.
license: MIT
metadata:
  author: time2ship
  version: "1.0.0"
---

# Express Best Practices Skill

Comprehensive security, performance, and architecture guidelines for production-ready Express/TypeScript APIs.

## Priority Hierarchy

Rules are prioritized by impact on production readiness and security:

| Priority | Impact | When to Apply | Can Skip? |
|----------|--------|---------------|-----------|
| **CRITICAL** | Security vulnerabilities that can lead to data breaches, unauthorized access, or system compromise | Every security-sensitive feature | **NEVER** - Security violations block deployment |
| **HIGH** | Performance issues that degrade user experience or increase infrastructure costs | Features with database queries, external APIs, or high traffic | Rarely - Only with explicit performance requirements waiver |
| **MEDIUM** | Architecture violations that increase technical debt or make code unmaintainable | All new code and refactoring | Sometimes - Can defer with tech debt ticket |
| **LOW** | Code quality issues that reduce consistency or readability | All code changes | Often - Focus on critical/high first |

## Quick Reference

| Category | Priority | Prefix | Rules | Focus Area |
|----------|----------|--------|-------|------------|
| **Security** | CRITICAL | `sec-` | 12 | Authentication, validation, attack prevention |
| **Performance** | HIGH | `perf-` | 10 | Database optimization, caching, response time |
| **Architecture** | MEDIUM | `arch-` | 8 | Layer separation, type safety, error handling |
| **Code Quality** | LOW | `quality-` | 5 | Consistency, naming, project structure |

**Total: 35 rules**

## When to Apply This Skill

Automatically apply these rules when:

- Writing new Express routes, controllers, or services
- Implementing authentication or authorization logic
- Adding database queries, schemas, or migrations
- Handling user input or external data
- Reviewing code for security vulnerabilities
- Refactoring existing API code
- Optimizing slow endpoints or database queries
- Fixing production bugs or incidents
- Creating new features in the API application
- Setting up middleware or global handlers

## Security Rules (CRITICAL Priority)

**Never skip these rules. Security violations block deployment.**

### Authentication & Authorization (4 rules)

- `sec-auth-jwt-secret` - Use strong, rotated JWT secrets; never hardcode or commit to version control
- `sec-auth-password-hashing` - Hash passwords with bcrypt/argon2; never store plain text; use proper salt rounds (10-12)
- `sec-auth-token-expiry` - Set reasonable JWT expiration times; implement refresh token rotation
- `sec-authorize-middleware` - Check permissions after authentication; fail closed on errors; validate role/scope

### Input Validation & Sanitization (4 rules)

- `sec-input-validation-zod` - Validate ALL inputs with Zod schemas at route boundaries; reject invalid data immediately
- `sec-sql-injection-drizzle` - Use Drizzle query builder exclusively; NEVER concatenate strings into SQL queries
- `sec-xss-prevention` - Sanitize HTML output; set Content-Security-Policy headers; escape user-generated content
- `sec-path-traversal` - Validate file paths against allowlists; reject `..` sequences; use absolute paths

### Secrets & Configuration (2 rules)

- `sec-secrets-env` - Store secrets in environment variables; validate all required env vars on startup; use .env.example
- `sec-error-leakage` - Sanitize error messages in production; never expose stack traces or internal paths to clients

### Attack Prevention (2 rules)

- `sec-rate-limiting` - Implement rate limiting per IP/user for authentication and sensitive endpoints
- `sec-cors-config` - Configure CORS with specific origins; never use `origin: '*'` in production; validate credentials flag

## Performance Rules (HIGH Priority)

**Apply to all features with database queries or external API calls.**

### Database Optimization (4 rules)

- `perf-n-plus-one` - Use joins or `findMany` with relations; never query inside loops; batch operations
- `perf-connection-pooling` - Configure database connection pool size; handle connection limits; monitor pool usage
- `perf-select-specific` - Select only needed columns; avoid `SELECT *`; minimize data transfer
- `perf-database-indexes` - Add indexes for columns in WHERE, JOIN, ORDER BY clauses; analyze query plans

### Response Optimization (3 rules)

- `perf-compression` - Enable gzip/brotli compression for JSON responses; configure compression thresholds
- `perf-pagination` - Implement cursor or offset pagination for list endpoints; limit maximum page size
- `perf-streaming` - Use Node.js streams for large file uploads/downloads; avoid loading entire files into memory

### Caching Strategies (3 rules)

- `perf-cache-headers` - Set appropriate Cache-Control headers for cacheable resources; use ETags
- `perf-response-caching` - Cache expensive computed responses with Redis or in-memory; set TTLs appropriately
- `perf-avoid-blocking` - Don't await non-critical operations (logging, analytics); use fire-and-forget pattern

## Architecture Rules (MEDIUM Priority)

**Enforce feature-based architecture patterns from architecture.md.**

### Layer Separation (3 rules)

- `arch-no-business-in-routes` - Routes must be thin; only handle HTTP concerns; delegate all logic to services
- `arch-no-db-in-routes` - Routes cannot import database or schemas directly; must call services
- `arch-services-throw-errors` - Services throw typed errors; never return error objects or status codes

### Type Safety (3 rules)

- `arch-no-any-types` - Forbidden: never use `any` type; use `unknown`, proper types, or generics instead
- `arch-explicit-return-types` - All functions must have explicit return type annotations; aids refactoring
- `arch-type-inference-zod` - Infer TypeScript types from Zod schemas; avoid duplicating type definitions

### Error Handling (2 rules)

- `arch-async-handler-wrapper` - Wrap all async route handlers to catch promise rejections automatically
- `arch-custom-error-classes` - Use AppError subclasses with HTTP status codes; avoid generic Error class

## Code Quality Rules (LOW Priority)

**Apply to maintain consistency and readability across the codebase.**

- `quality-import-order` - Order imports: external packages → internal (@/) → relative → type imports
- `quality-naming-conventions` - Use kebab-case for files, camelCase for variables/functions, PascalCase for classes
- `quality-no-magic-values` - Extract constants for roles, statuses, limits; avoid hardcoded strings/numbers
- `quality-feature-structure` - Follow feature folder structure: routes/, services/, validators/, schemas/
- `quality-barrel-exports` - Avoid barrel files (index.ts re-exports); export from feature entry point only

## How to Use This Skill

### For Development

1. **Before writing code**: Review relevant rules for your feature category (auth → security, queries → performance)
2. **During implementation**: Reference individual rule files in `rules/` directory for code examples
3. **Before committing**: Run through checklist of applicable rules in AGENTS.md

### For Code Review

1. **Automated checks**: Use linters and type checker to catch some rule violations
2. **Manual review**: Check CRITICAL security rules first, then HIGH performance rules
3. **Documentation**: Reference specific rule names in review comments (e.g., "Violates `sec-input-validation-zod`")

### For Debugging

1. **Production issues**: Check security and performance rules for common causes
2. **Test failures**: Verify architecture rules are followed (proper error handling, type safety)
3. **Performance problems**: Run through all `perf-` rules systematically

### For AI Agents

Reference the compiled [AGENTS.md](./AGENTS.md) file which contains all 35 rules with full code examples in a single document optimized for context loading.

## Rule File Format

Each rule file in `rules/` directory follows this structure:

- **Brief explanation** - What the rule prevents and why
- **❌ WRONG** - Code example demonstrating the anti-pattern
- **✅ CORRECT** - Code example showing proper implementation
- **Why This Matters** - Security implications, performance impact, or maintainability concerns

## Integration with Architecture.md

This skill **enforces** patterns documented in [architecture.md](../../references/architecture.md):

| Architecture.md | Express Best Practices |
|----------------|------------------------|
| Guidelines ("should") | Rules ("must") |
| Text descriptions | Code examples |
| System design patterns | Tactical implementations |
| Feature organization | Security, performance, quality |

**Use both together:**
- Consult architecture.md for system design and folder structure
- Apply express-best-practices for code-level implementation and security

## Common Usage Patterns

### Pattern 1: New Authentication Feature

Apply these rules in order:
1. `sec-auth-jwt-secret` - Configure secrets properly
2. `sec-auth-password-hashing` - Hash passwords securely
3. `sec-input-validation-zod` - Validate login/register inputs
4. `sec-rate-limiting` - Prevent brute force attacks
5. `arch-no-business-in-routes` - Keep routes thin
6. `arch-services-throw-errors` - Proper error handling

### Pattern 2: Database Query Optimization

Apply these rules in order:
1. `perf-n-plus-one` - Check for query loops
2. `perf-select-specific` - Select only needed columns
3. `perf-database-indexes` - Add indexes for WHERE clauses
4. `sec-sql-injection-drizzle` - Use query builder safely
5. `arch-no-db-in-routes` - Query through services only

### Pattern 3: New API Endpoint

Apply these rules in order:
1. `sec-input-validation-zod` - Validate all inputs
2. `arch-no-business-in-routes` - Delegate to services
3. `arch-async-handler-wrapper` - Handle async errors
4. `perf-pagination` - Paginate list responses
5. `perf-cache-headers` - Set appropriate caching
6. `quality-feature-structure` - Follow folder structure

## Verification Checklist

Before marking a feature complete, verify:

### Security (CRITICAL)
- [ ] All inputs validated with Zod schemas
- [ ] No SQL string concatenation; Drizzle query builder used
- [ ] JWT secrets from environment variables
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured for specific origins
- [ ] Error messages sanitized in production
- [ ] No secrets committed to git

### Performance (HIGH)
- [ ] No N+1 query patterns
- [ ] Database indexes for queried columns
- [ ] Pagination on list endpoints
- [ ] Compression enabled for JSON
- [ ] Response caching where appropriate
- [ ] Specific column selection (no SELECT *)

### Architecture (MEDIUM)
- [ ] No business logic in routes
- [ ] No database imports in routes
- [ ] Services throw errors, don't return them
- [ ] No `any` types used
- [ ] All functions have explicit return types
- [ ] Types inferred from Zod schemas

### Code Quality (LOW)
- [ ] Imports ordered correctly
- [ ] Naming conventions followed
- [ ] No magic values; constants used
- [ ] Feature folder structure maintained
- [ ] No unnecessary barrel files

## Getting Help

- **Individual rules**: Read specific rule file in `rules/` directory
- **Full reference**: See AGENTS.md for all rules compiled
- **Architecture patterns**: Consult architecture.md for system design
- **Examples**: Check `examples/` directory for violations and corrections

## Version History

- **v1.0.0** (2026-01-16) - Initial release with 35 rules across 4 categories

---

**License**: MIT
**Maintained by**: time2ship team
**Last updated**: 2026-01-16
