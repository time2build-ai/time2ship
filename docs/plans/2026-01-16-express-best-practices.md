# Express Best Practices Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use @superpowers:executing-plans or @superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Create a comprehensive Express/TypeScript best practices skill with 35 rules covering security, performance, architecture, and code quality.

**Architecture:** Documentation-based skill following the React best practices pattern. Creates SKILL.md overview, 35 individual rule files with code examples, and compiled AGENTS.md for AI agents.

**Tech Stack:** Markdown documentation, TypeScript code examples, references to existing architecture.md patterns.

---

## Task 1: Create Skill Directory Structure

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/SKILL.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/`

**Step 1: Create directory structure**

```bash
cd /Users/thiagolopez/time2build/boilerplates/time2ship/.worktrees/express-best-practices
mkdir -p apps/api/.claude/skills/express-best-practices/rules
```

**Step 2: Verify structure created**

Run: `ls -la apps/api/.claude/skills/express-best-practices/`
Expected: Directory exists with rules/ subdirectory

**Step 3: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/
git commit -m "feat(api): create express-best-practices skill structure

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Write SKILL.md Overview

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/SKILL.md`

**Step 1: Write SKILL.md with metadata and overview**

Create file with complete content including:
- YAML frontmatter with name, description, license, metadata
- Priority hierarchy table
- Quick reference table for all 4 categories
- When to Apply section
- Category summaries (Security, Performance, Architecture, Code Quality)
- Full rule list organized by category
- How to Use section
- Reference to AGENTS.md

**Step 2: Verify content**

Run: `cat apps/api/.claude/skills/express-best-practices/SKILL.md | head -30`
Expected: YAML frontmatter and overview sections visible

**Step 3: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/SKILL.md
git commit -m "feat(api): add express-best-practices SKILL.md overview

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Write Security Rules (12 files)

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-auth-jwt-secret.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-auth-password-hashing.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-auth-token-expiry.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-authorize-middleware.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-input-validation-zod.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-sql-injection-drizzle.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-xss-prevention.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-path-traversal.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-secrets-env.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-error-leakage.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-rate-limiting.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/sec-cors-config.md`

**Step 1: Write sec-auth-jwt-secret.md**

Each file follows format:
```markdown
# rule-name

Brief explanation (1-2 sentences)

## ❌ WRONG

\`\`\`typescript
// Bad code with inline comments
\`\`\`

## ✅ CORRECT

\`\`\`typescript
// Good code with inline comments
\`\`\`

## Why This Matters

- Security implications
- Common mistakes
- References
```

**Step 2: Write remaining 11 security rule files**

Follow same format for each:
- sec-auth-password-hashing.md
- sec-auth-token-expiry.md
- sec-authorize-middleware.md
- sec-input-validation-zod.md
- sec-sql-injection-drizzle.md
- sec-xss-prevention.md
- sec-path-traversal.md
- sec-secrets-env.md
- sec-error-leakage.md
- sec-rate-limiting.md
- sec-cors-config.md

**Step 3: Verify all security rules created**

Run: `ls apps/api/.claude/skills/express-best-practices/rules/sec-*.md | wc -l`
Expected: 12

**Step 4: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/rules/sec-*.md
git commit -m "feat(api): add 12 security rules for express best practices

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Write Performance Rules (10 files)

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-n-plus-one.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-connection-pooling.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-select-specific.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-database-indexes.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-compression.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-pagination.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-streaming.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-cache-headers.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-response-caching.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/perf-avoid-blocking.md`

**Step 1: Write all 10 performance rule files**

Follow same format as security rules but focus on:
- Database query optimization
- Response optimization
- Caching strategies
- Include performance metrics and benchmarks where relevant

**Step 2: Verify all performance rules created**

Run: `ls apps/api/.claude/skills/express-best-practices/rules/perf-*.md | wc -l`
Expected: 10

**Step 3: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/rules/perf-*.md
git commit -m "feat(api): add 10 performance rules for express best practices

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Write Architecture Rules (8 files)

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-no-business-in-routes.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-no-db-in-routes.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-services-throw-errors.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-no-any-types.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-explicit-return-types.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-type-inference-zod.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-async-handler-wrapper.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/arch-custom-error-classes.md`

**Step 1: Write all 8 architecture rule files**

These rules enforce patterns from `apps/api/.claude/references/architecture.md`:
- Reference existing architecture.md patterns
- Show violations and correct implementations
- Emphasize strict enforcement

**Step 2: Verify all architecture rules created**

Run: `ls apps/api/.claude/skills/express-best-practices/rules/arch-*.md | wc -l`
Expected: 8

**Step 3: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/rules/arch-*.md
git commit -m "feat(api): add 8 architecture rules for express best practices

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Write Code Quality Rules (5 files)

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/rules/quality-import-order.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/quality-naming-conventions.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/quality-no-magic-values.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/quality-feature-structure.md`
- Create: `apps/api/.claude/skills/express-best-practices/rules/quality-barrel-exports.md`

**Step 1: Write all 5 code quality rule files**

Focus on consistency and maintainability:
- Import organization
- Naming conventions
- Constants usage
- Feature structure
- Export patterns

**Step 2: Verify all code quality rules created**

Run: `ls apps/api/.claude/skills/express-best-practices/rules/quality-*.md | wc -l`
Expected: 5

**Step 3: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/rules/quality-*.md
git commit -m "feat(api): add 5 code quality rules for express best practices

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Section Dividers File

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/rules/_sections.md`

**Step 1: Write _sections.md**

Create markdown file with section headers for compilation:

```markdown
## Security Rules (CRITICAL Priority)

---

## Performance Rules (HIGH Priority)

---

## Architecture Rules (MEDIUM Priority)

---

## Code Quality Rules (LOW Priority)

---
```

**Step 2: Verify file created**

Run: `cat apps/api/.claude/skills/express-best-practices/rules/_sections.md`
Expected: Section headers visible

**Step 3: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/rules/_sections.md
git commit -m "feat(api): add section dividers for compilation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Compile AGENTS.md

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/AGENTS.md`

**Step 1: Write AGENTS.md header**

Include:
- Title and purpose
- Priority system explanation
- Table of contents

**Step 2: Compile all rules into single document**

Aggregate all 35 rule files in priority order:
1. All 12 security rules (expanded with full content)
2. All 10 performance rules (expanded)
3. All 8 architecture rules (expanded)
4. All 5 code quality rules (expanded)
5. Summary checklist at end

**Step 3: Verify compilation**

Run: `wc -l apps/api/.claude/skills/express-best-practices/AGENTS.md`
Expected: Large file (1500+ lines with all rules expanded)

**Step 4: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/AGENTS.md
git commit -m "feat(api): compile AGENTS.md with all 35 rules

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update API CLAUDE.md Reference

**Files:**
- Modify: `apps/api/.claude/CLAUDE.md`

**Step 1: Read current CLAUDE.md**

Run: `cat apps/api/.claude/CLAUDE.md`

**Step 2: Add reference to express-best-practices skill**

Add section:

```markdown
## Skills

Before working on this API, review the relevant skills:

- [Express Best Practices](./.claude/skills/express-best-practices/SKILL.md) - Security, performance, and architecture guidelines for production-ready Express/TypeScript APIs
```

**Step 3: Verify update**

Run: `cat apps/api/.claude/CLAUDE.md`
Expected: Skills section with express-best-practices reference

**Step 4: Commit**

```bash
git add apps/api/.claude/CLAUDE.md
git commit -m "docs(api): reference express-best-practices skill in CLAUDE.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Test Skill with Sample Code

**Files:**
- Create: `apps/api/.claude/skills/express-best-practices/examples/violations.ts`
- Create: `apps/api/.claude/skills/express-best-practices/examples/correct.ts`

**Step 1: Create examples directory**

```bash
mkdir -p apps/api/.claude/skills/express-best-practices/examples
```

**Step 2: Write violations.ts**

Create file with code samples that violate multiple rules:
- SQL injection vulnerability
- Business logic in routes
- Using `any` types
- Magic values
- No input validation

**Step 3: Write correct.ts**

Create file with corrected implementations following all rules.

**Step 4: Verify examples created**

Run: `ls apps/api/.claude/skills/express-best-practices/examples/`
Expected: violations.ts and correct.ts

**Step 5: Commit**

```bash
git add apps/api/.claude/skills/express-best-practices/examples/
git commit -m "feat(api): add example violations and corrections for testing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Root CLAUDE.md Reference

**Files:**
- Modify: `.claude/CLAUDE.md`

**Step 1: Read root CLAUDE.md**

Run: `cat .claude/CLAUDE.md`

**Step 2: Verify API reference exists**

Check that API app already references its own CLAUDE.md with skills.

**Step 3: Add note if needed**

If not already clear, add note:

```markdown
Each app has its own skills - see app-specific CLAUDE.md files for details.
```

**Step 4: Commit if modified**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: clarify app-specific skills in root CLAUDE.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Final Verification

**Step 1: Verify all files created**

Run:
```bash
find apps/api/.claude/skills/express-best-practices -type f -name "*.md" | sort
```

Expected:
- SKILL.md
- AGENTS.md
- rules/_sections.md
- 12 sec-*.md files
- 10 perf-*.md files
- 8 arch-*.md files
- 5 quality-*.md files

Total: 38 markdown files

**Step 2: Count total rules**

Run:
```bash
ls apps/api/.claude/skills/express-best-practices/rules/*.md | grep -v "_sections" | wc -l
```

Expected: 35

**Step 3: Verify SKILL.md references all rules**

Run:
```bash
grep -c "^\- \`" apps/api/.claude/skills/express-best-practices/SKILL.md
```

Expected: At least 35 (one per rule)

**Step 4: Create final summary commit**

```bash
git add .
git commit -m "feat(api): complete express-best-practices skill v1.0

- 35 rules across 4 categories (Security, Performance, Architecture, Code Quality)
- Security-first prioritization (CRITICAL → HIGH → MEDIUM → LOW)
- Comprehensive code examples for each rule
- Compiled AGENTS.md for AI agent reference
- Integration with existing architecture.md patterns

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 5: Verify git log**

Run: `git log --oneline -12`
Expected: 11-12 commits showing progression through all tasks

---

## Success Criteria

✅ All 35 rule files created with code examples
✅ SKILL.md provides quick reference and overview
✅ AGENTS.md compiles all rules for AI agents
✅ API CLAUDE.md references the skill
✅ Example violations and corrections provided
✅ All commits follow conventional commit format
✅ Documentation is comprehensive and actionable

---

## Notes

- Each rule file must have ❌ WRONG and ✅ CORRECT code examples
- All TypeScript examples should reference the existing architecture patterns
- Security rules (CRITICAL) get most detailed treatment
- AGENTS.md should be 1500+ lines when fully compiled
- Use @superpowers:verification-before-completion before claiming done

---

**Estimated Time:** 2-3 hours for thorough implementation with high-quality code examples

**Next Steps After Implementation:**
1. Use skill when writing new API features
2. Reference during code reviews
3. Share with team for adoption
4. Gather feedback for v1.1 improvements
