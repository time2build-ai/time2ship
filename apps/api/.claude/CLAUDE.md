## Architecture Reference

Before working on this application, review the architecture guidelines:

- [Architecture Guidelines](./.claude/references/architecture.md) - Feature-based architecture, folder structure, naming conventions, and patterns

## Skills

Before working on this API, review the relevant skills:

- [Express Best Practices](./.claude/skills/express-best-practices/SKILL.md) - Security, performance, and architecture guidelines for production-ready Express/TypeScript APIs

## Working with this API

This is an Express + TypeScript API following a feature-based architecture with:

- **Feature Modules**: Self-contained vertical slices (routes, services, validators, schemas)
- **Strict TypeScript**: No `any` types, explicit return types required
- **Drizzle ORM**: Database access and schema management
- **Zod Validation**: Request validation at API boundaries
- **Layered Approach**: Routes → Services → Database

Always refer to the architecture documentation for detailed rules and patterns.
