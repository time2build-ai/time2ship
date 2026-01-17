<div align="center">

# 🚀 Time2Ship

### Ship your ideas faster with a production-ready full-stack boilerplate

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

A production-ready full-stack monorepo boilerplate featuring Next.js, Express, PostgreSQL, and Docker. Built for rapid development with modern best practices, comprehensive testing, and authentication out of the box.

[Getting Started](#-getting-started) • [Features](#-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- 📦 **Monorepo Architecture** - Workspace-based structure with shared tooling
- 🔷 **Full-Stack TypeScript** - Type safety across client and server
- ⚡ **Modern Frontend** - Next.js 16 with React 19, Tailwind CSS 4
- 🛡️ **Robust Backend** - Express API with feature-based architecture
- 🗄️ **PostgreSQL + Drizzle ORM** - Type-safe database layer
- 🔐 **JWT Authentication** - Complete auth with refresh tokens

</td>
<td width="50%">

### 🛠️ Developer Experience
- 🐳 **Docker Ready** - Full containerization with Docker Compose
- 🧪 **Comprehensive Testing** - Jest, Supertest, E2E in Docker
- 📧 **Email Service** - Nodemailer with template support
- ✅ **Code Quality** - ESLint, TypeScript strict mode, Husky
- 🔄 **Hot Reload** - Instant feedback during development
- 🎨 **Modern UI** - Tailwind CSS 4 with beautiful components

</td>
</tr>
</table>

## 🏗️ Tech Stack

<details open>
<summary><b>🎨 Frontend (Client)</b></summary>

```
📱 Framework    → Next.js 16 with App Router
⚛️  UI Library   → React 19
🎨 Styling      → Tailwind CSS 4
✅ Validation   → Zod
🔐 Auth         → JWT with httpOnly cookies
🔔 Notifications → Sonner
🎭 Components   → Custom UI library with shadcn/ui patterns
```

</details>

<details open>
<summary><b>⚙️ Backend (API)</b></summary>

```
🟢 Runtime      → Node.js with Express
📘 Language     → TypeScript
🗄️ Database     → PostgreSQL 16
🔧 ORM          → Drizzle ORM (type-safe)
🔐 Auth         → JWT (access + refresh tokens)
📧 Email        → Nodemailer with templates
🛡️ Security     → Helmet, CORS, bcrypt
📊 Logging      → Winston with daily rotation
```

</details>

<details open>
<summary><b>🚀 DevOps & Tools</b></summary>

```
🐳 Containers   → Docker & Docker Compose
🧪 Testing      → Jest, Supertest, E2E (Docker)
🔄 CI/CD        → GitHub Actions ready
🪝 Git Hooks    → Husky with lint-staged
📝 Linting      → ESLint with TypeScript
🎯 Type Check   → TypeScript strict mode
```

</details>

## 📁 Project Structure

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

## 🚀 Getting Started

### 📋 Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js** 20+ ([Download](https://nodejs.org/))
- ✅ **npm** or **yarn**
- ✅ **Docker** & **Docker Compose** ([Download](https://www.docker.com/get-started))
- ✅ **PostgreSQL** (optional - only if running locally without Docker)

### ⚡ Quick Start

Get up and running in 3 steps:

<table>
<tr>
<td>

**1️⃣ Clone & Install**
```bash
git clone <repository-url>
cd time2ship
npm install
```

</td>
</tr>
<tr>
<td>

**2️⃣ Configure Environment**
```bash
# API
cd apps/api
cp .env.example .env

# Client
cd ../client
cp .env.example .env
```
> 💡 Edit the `.env` files with your configuration

</td>
</tr>
<tr>
<td>

**3️⃣ Launch with Docker** 🐳
```bash
# From project root
docker-compose up
```

**🎉 Done!** Visit:
- 🎨 **Frontend**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **API**: [http://localhost:3001](http://localhost:3001)
- 🗄️ **Database**: `localhost:5432`

</td>
</tr>
</table>

### 💻 Development Options

<details>
<summary><b>🐳 Option 1: Docker (Recommended)</b></summary>

Start all services with a single command:

```bash
docker-compose up
```

**Services will be available at:**
- 🎨 **Client**: http://localhost:3000
- ⚙️ **API**: http://localhost:3001
- 🗄️ **PostgreSQL**: localhost:5432

**Useful Docker commands:**
```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up --build
```

</details>

<details>
<summary><b>🔧 Option 2: Local Development</b></summary>

Run services individually for more control:

**Step 1: Start PostgreSQL**
```bash
docker-compose up db
```

**Step 2: Run API** (in new terminal)
```bash
cd apps/api
npm run dev
```

**Step 3: Run Client** (in new terminal)
```bash
cd apps/client
npm run dev
```

</details>

### 🗄️ Database Setup

<details>
<summary><b>Click to expand database commands</b></summary>

```bash
cd apps/api

# 📝 Generate migrations from schema changes
npm run db:generate

# 🚀 Apply migrations to database
npm run db:migrate

# 🌱 Seed database with sample data (optional)
npm run db:seed

# 🎨 Open Drizzle Studio (visual database editor)
npm run db:studio
```

**Drizzle Studio** provides a beautiful UI to view and edit your database at `https://local.drizzle.studio`

#### 👥 Default Seeded Users

After running `npm run db:seed`, the following test users will be available:

| Email | Password | Role |
|-------|----------|------|
| `test@time2ship.ai` | `Test1234!` | Test User |
| `admin@time2ship.ai` | `Admin1234!` | Admin User |

> 🔒 **Security Note**: Change these credentials in production!

</details>

## 📜 Available Scripts

<details>
<summary><b>🏠 Root Level Commands</b></summary>

| Command | Description |
|---------|-------------|
| `npm run prepare` | 🔧 Install Husky hooks |
| `npm run review` | 👀 Review changes before commit |

</details>

<details>
<summary><b>🎨 Client App (apps/client)</b></summary>

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start development server |
| `npm run build` | 📦 Build for production |
| `npm start` | ▶️ Start production server |
| `npm run lint` | 🔍 Run ESLint |

</details>

<details>
<summary><b>⚙️ API App (apps/api)</b></summary>

**Development**
| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start dev server with hot reload |
| `npm run build` | 📦 Build TypeScript |
| `npm start` | ▶️ Start production server |
| `npm run lint` | 🔍 Run ESLint |
| `npm run type-check` | ✅ Type check without building |

**Testing**
| Command | Description |
|---------|-------------|
| `npm test` | 🧪 Run unit tests |
| `npm run test:watch` | 👀 Run tests in watch mode |
| `npm run test:coverage` | 📊 Generate coverage report |
| `npm run test:e2e` | 🔬 Run E2E tests in Docker |

**Database**
| Command | Description |
|---------|-------------|
| `npm run db:generate` | 📝 Generate migrations |
| `npm run db:migrate` | 🚀 Apply migrations |
| `npm run db:studio` | 🎨 Open Drizzle Studio |
| `npm run db:seed` | 🌱 Seed database |

</details>

## 🧪 Testing

The project includes comprehensive testing at multiple levels:

<table>
<tr>
<td width="50%">

### Unit & Integration Tests

```bash
cd apps/api

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests are colocated with features in `__tests__/` directories.

</td>
<td width="50%">

### E2E Tests

```bash
cd apps/api

# Run E2E tests in Docker
npm run test:e2e

# Cleanup after tests
npm run test:e2e:down
```

E2E tests run in isolated Docker containers with a separate test database for true integration testing.

</td>
</tr>
</table>

## 🔐 Authentication

Complete authentication system out of the box:

<table>
<tr>
<td width="50%">

### Features
- ✅ **Registration** - Email/password with validation
- ✅ **Login** - JWT access + refresh tokens
- ✅ **Token Refresh** - Automatic renewal
- ✅ **Email Verification** - Optional verification flow
- ✅ **Password Reset** - Secure reset via email
- ✅ **Session Management** - httpOnly cookies

</td>
<td width="50%">

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | 📝 User registration |
| `/api/auth/login` | POST | 🔑 User login |
| `/api/auth/refresh` | POST | 🔄 Refresh tokens |
| `/api/auth/logout` | POST | 👋 User logout |
| `/api/auth/me` | GET | 👤 Get current user |

</td>
</tr>
</table>

## ⚙️ Environment Variables

<details>
<summary><b>🔧 API Configuration (apps/api/.env)</b></summary>

```env
# 🖥️ Server
NODE_ENV=development
PORT=3001

# 🗄️ Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time2ship
DB_USER=postgres
DB_PASSWORD=postgres

# 🔐 JWT Secrets (Generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here

# 📧 Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@time2ship.com

# 🌐 URLs
CLIENT_URL=http://localhost:3000
```

> 💡 **Pro Tip**: Generate secure JWT secrets with `openssl rand -base64 32`

</details>

<details>
<summary><b>🎨 Client Configuration (apps/client/.env)</b></summary>

```env
# 🌐 API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001  # Browser requests
API_URL=http://api:3001                     # Server-side (Docker)
```

> 💡 **Note**: `NEXT_PUBLIC_` variables are exposed to the browser

</details>

## 🏛️ Architecture

<details>
<summary><b>⚙️ Backend Architecture</b></summary>

The API follows a **feature-based architecture** for better scalability and maintainability:

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

**Key Principles:**
- ✅ Features are self-contained modules
- ✅ Shared code lives in `common/`
- ✅ Clear separation of concerns
- ✅ Easy to test and maintain

</details>

<details>
<summary><b>🎨 Frontend Architecture</b></summary>

The client uses **Next.js App Router** with a feature-based structure:

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

**Key Principles:**
- ✅ Server-first with RSC (React Server Components)
- ✅ Route groups for layout organization
- ✅ Shared components for consistency
- ✅ Type-safe API client

</details>

## 🔄 Git Workflow

<details>
<summary><b>Click to expand Git workflow details</b></summary>

The project uses **Husky** for automated code quality checks:

### Pre-commit Hooks
- 🔍 **Linting** - ESLint on staged files
- ✅ **Type Checking** - TypeScript compilation check
- 📝 **Formatting** - Ensure code style consistency

### Pre-push Hooks
- 🧪 **Tests** - Run test suite before pushing

**Manual Review:**
```bash
npm run review  # Review all changes before commit
```

This ensures code quality and prevents broken code from reaching the repository.

</details>

## 🚀 Deployment

<details>
<summary><b>📦 Production Build</b></summary>

```bash
# Build API
cd apps/api
npm run build

# Build Client
cd apps/client
npm run build
```

</details>

<details>
<summary><b>🐳 Docker Production</b></summary>

```bash
docker-compose -f docker-compose.prod.yml up
```

> ⚠️ **Important**: Update environment variables for production before deploying

</details>

---

## 📚 Documentation

Comprehensive documentation for each part of the project:

- 📖 [Husky Configuration](docs/HUSKY.md)
- 🔧 [API Guidelines](apps/api/.claude/CLAUDE.md)
- 🎨 [Client Guidelines](apps/client/.claude/CLAUDE.md)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. 🔱 **Fork & Clone** - Fork the repo and clone locally
2. 🌿 **Create Branch** - `git checkout -b feature/amazing-feature`
3. ✨ **Make Changes** - Implement your feature or fix
4. ✅ **Run Tests** - Ensure all tests pass
5. 📝 **Commit** - Use conventional commits
6. 🚀 **Push** - Push to your fork
7. 🎯 **Pull Request** - Submit a PR with clear description

## 📄 License

This project is licensed under the **ISC License**.

## 💬 Support

Need help? We're here for you!

- 🐛 **Bug Reports**: [Open an issue](https://github.com/your-repo/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/your-repo/discussions)
- 📧 **Contact**: your-email@example.com

---

<div align="center">

**Built with ❤️ using Time2Ship**

⭐ Star us on GitHub — it motivates us a lot!

</div>
