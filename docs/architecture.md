# Architecture

## Overview

Time2Ship is a full-stack monorepo boilerplate built with TypeScript, featuring a feature-based architecture that promotes scalability, maintainability, and developer productivity. The architecture separates concerns between client and server while maintaining type safety across the entire stack.

## Tech Stack

### Frontend (Client)

| Component | Technology |
|-----------|-----------|
| 📱 Framework | Next.js 16 with App Router |
| ⚛️ UI Library | React 19 |
| 🎨 Styling | Tailwind CSS 4 |
| ✅ Validation | Zod |
| 🔐 Auth | JWT with httpOnly cookies |
| 🔔 Notifications | Sonner |
| 🎭 Components | Custom UI library with shadcn/ui patterns |

### Backend (API)

| Component | Technology |
|-----------|-----------|
| 🟢 Runtime | Node.js with Express |
| 📘 Language | TypeScript |
| 🗄️ Database | PostgreSQL 16 |
| 🔧 ORM | Drizzle ORM (type-safe) |
| 🔐 Auth | JWT (access + refresh tokens) |
| 📧 Email | Nodemailer with templates |
| 🛡️ Security | Helmet, CORS, bcrypt |
| 📊 Logging | Winston with daily rotation |

### DevOps & Tools

| Component | Technology |
|-----------|-----------|
| 🐳 Containers | Docker & Docker Compose |
| 🧪 Testing | Jest, Supertest, E2E (Docker) |
| 🔄 CI/CD | GitHub Actions ready |
| 🪝 Git Hooks | Husky with lint-staged |
| 📝 Linting | ESLint with TypeScript |
| 🎯 Type Check | TypeScript strict mode |

## Project Structure

### Monorepo Layout

```
time2ship/
├── 📱 apps/
│   ├── 🎨 client/              # Next.js frontend application
│   │   ├── app/                # App router pages & layouts
│   │   ├── src/                # Shared components, lib, hooks
│   │   │   ├── features/       # Feature-specific code
│   │   │   └── shared/         # Reusable components & utilities
│   │   └── .claude/            # AI assistant guidelines
│   │
│   └── ⚙️  api/                # Express backend application
│       ├── src/
│       │   ├── features/       # Feature-based modules (auth, etc.)
│       │   ├── common/         # Shared utilities & middleware
│       │   └── config/         # App configuration
│       ├── drizzle/            # Database migrations & schema
│       └── .claude/            # AI assistant guidelines
│
├── 🐳 docker-compose.yml       # Development environment
├── 🪝 .husky/                  # Git hooks
├── 📚 docs/                    # Documentation
└── 📦 package.json             # Workspace configuration
```

### Directory Conventions

- **apps/** - Contains all applications (client, api)
- **apps/*/src/features/** - Feature modules (self-contained)
- **apps/*/src/common/** - Shared utilities and services
- **apps/*/.claude/** - AI assistant context and guidelines
- **docs/** - Project documentation
- **.husky/** - Git hooks for code quality

## Backend Architecture

The API follows a **feature-based architecture** for better scalability and maintainability.

### Feature-based Structure

```
src/
├── 📦 features/
│   └── auth/                    # Authentication feature module
│       ├── routes/              # Route definitions
│       ├── controllers/         # Request/response logic
│       ├── services/            # Business logic
│       ├── validators/          # Input validation schemas
│       └── __tests__/           # Feature-specific tests
│
├── 🔧 common/                   # Shared utilities
│   ├── middleware/              # Express middleware (auth, error handling)
│   ├── services/                # Shared services (email, logger)
│   └── utils/                   # Helper functions
│
└── ⚙️ config/                   # Application configuration
    ├── database.ts              # Database connection
    ├── env.ts                   # Environment variables
    └── logger.ts                # Logging configuration
```

### Key Principles

- ✅ **Self-contained features** - Each feature module contains all related code
- ✅ **Shared common code** - Reusable utilities live in `common/`
- ✅ **Clear separation of concerns** - Routes, controllers, services, validators
- ✅ **Easy to test** - Feature-scoped tests in `__tests__/` directories
- ✅ **Easy to maintain** - Features can be added/removed independently

### Module Organization

Each feature module follows this structure:

- **routes/** - Express route definitions
- **controllers/** - Request handling and response formatting
- **services/** - Business logic and data access
- **validators/** - Zod schemas for input validation
- **__tests__/** - Unit and integration tests

## Frontend Architecture

The client uses **Next.js App Router** with a feature-based structure and React Server Components.

### App Router Pattern

```
app/
├── 🔓 (auth)/                   # Auth route group (public)
│   ├── login/                   # Login page
│   └── register/                # Registration page
│
└── 🔐 (dashboard)/              # Protected routes
    └── ...                      # Dashboard pages

src/
├── 📦 features/                 # Feature-specific modules
│   └── auth/                    # Auth components & logic
│
└── 🔧 shared/
    ├── components/              # Reusable UI components
    │   └── ui/                  # Base UI components
    ├── lib/                     # Utility functions
    │   ├── api/                 # API client
    │   └── utils.ts             # Helpers
    └── hooks/                   # Custom React hooks
```

### Feature Organization

- **Route Groups** - Organize routes by feature (auth, dashboard)
- **Server Components** - Default to RSC for performance
- **Client Components** - Use "use client" only when needed
- **Shared Components** - Reusable UI in `src/shared/components/`
- **Type-safe API** - API client with TypeScript

### Key Principles

- ✅ **Server-first** - Leverage React Server Components
- ✅ **Route groups** - Logical layout organization
- ✅ **Shared components** - Consistency across features
- ✅ **Type safety** - TypeScript throughout
- ✅ **Feature isolation** - Features are self-contained
