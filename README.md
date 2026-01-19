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

</div>

---

## 🚀 Quick Start

Get started in seconds:

```bash
npx create-time2ship my-app
cd my-app
npm run dev
```

That's it! Your app is running at:
- 🎨 **Frontend**: http://localhost:3000
- ⚙️ **API**: http://localhost:3001

**Next steps:** [Complete Setup Guide](docs/getting-started.md)

---

## 💡 What is Time2Ship?

Time2Ship is a production-ready monorepo boilerplate that eliminates weeks of setup time. It's the foundation you need to ship your ideas faster, with all the essential features already configured:

- Full-stack TypeScript for end-to-end type safety
- Modern frontend with Next.js 16 and React 19
- Robust Express API with PostgreSQL
- Complete authentication system (JWT + refresh tokens)
- Docker-ready development and deployment
- Comprehensive testing setup
- Production-grade security and best practices

---

## ✨ Key Features

- 📦 **Monorepo Architecture** - Workspace-based structure with shared tooling
- 🔷 **Full-Stack TypeScript** - Type safety across client and server
- ⚡ **Next.js 16 + React 19** - Latest features with App Router
- 🛡️ **Express + PostgreSQL** - Robust backend with type-safe ORM
- 🔐 **Authentication Ready** - JWT with refresh tokens, password reset
- 🐳 **Docker Compose** - One command to start everything
- 🧪 **Testing Setup** - Jest, Supertest, E2E tests in Docker
- 📧 **Email Service** - Nodemailer with template support
- ✅ **Code Quality** - ESLint, TypeScript strict, Husky hooks
- 🎨 **Modern UI** - Tailwind CSS 4 with component library

---

## ⚙️ Environment Variables

Time2Ship requires configuration for both API and Client applications. See [complete setup guide](docs/getting-started.md#environment-variables).

### API (apps/api/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Environment (`development`/`production`) |
| `PORT` | Yes | API port (default: `3001`) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port (default: `5432`) |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database username |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_ACCESS_SECRET` | Yes | JWT access token secret (generate with `openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token secret (generate with `openssl rand -base64 32`) |
| `CLIENT_URL` | Yes | Frontend URL (e.g., `http://localhost:3000`) |
| `EMAIL_HOST` | Optional | SMTP host for emails |
| `EMAIL_PORT` | Optional | SMTP port |
| `EMAIL_USER` | Optional | SMTP username |
| `EMAIL_PASSWORD` | Optional | SMTP password |
| `EMAIL_FROM` | Optional | Email sender address |

### Client (apps/client/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API URL for browser requests (e.g., `http://localhost:3001`) |
| `API_URL` | Optional | API URL for server-side requests (Docker: `http://api:3001`) |

**Quick Setup:**
```bash
# API
cd apps/api && cp .env.example .env

# Client
cd apps/client && cp .env.example .env
```

---

## 📚 Documentation

Comprehensive guides for every aspect of Time2Ship:

### Getting Started
- [**Installation & Setup**](docs/getting-started.md) - Prerequisites, environment config, database setup
- [**Architecture**](docs/architecture.md) - Project structure, tech stack, design patterns

### Core Features
- [**Authentication**](docs/authentication.md) - JWT implementation, API endpoints, customization
- [**Testing**](docs/testing.md) - Unit tests, E2E tests, best practices

### Deployment & Contributing
- [**Deployment**](docs/deployment.md) - Production builds, Docker, platform guides (includes Dokploy)
- [**Contributing**](docs/contributing.md) - Development workflow, code standards, PRs

---

## 🎯 Two Paths Forward

### 🚢 Using Time2Ship

**You want to build an app with Time2Ship:**

1. **Quick Start**: `npx create-time2ship my-app`
2. **Setup Guide**: [Getting Started](docs/getting-started.md)
3. **Learn Features**: [Authentication](docs/authentication.md), [Testing](docs/testing.md)
4. **Deploy**: [Deployment Guide](docs/deployment.md)

### 🛠️ Contributing to Time2Ship

**You want to improve the boilerplate itself:**

1. **Setup**: [Contributing Guide](docs/contributing.md)
2. **Architecture**: [Architecture Docs](docs/architecture.md)
3. **Standards**: [Code Quality Guidelines](docs/contributing.md#code-quality-standards)
4. **Submit**: [Pull Request Process](docs/contributing.md#pull-request-process)

---

## 🏗️ Built With

**Frontend:** Next.js 16, React 19, Tailwind CSS 4, Zod
**Backend:** Node.js, Express, TypeScript, Drizzle ORM
**Database:** PostgreSQL 16
**DevOps:** Docker, Jest, GitHub Actions, Husky

**[View Full Tech Stack →](docs/architecture.md#tech-stack)**

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 💬 Support

Need help? We're here for you!

- 🐛 **Bug Reports**: [Open an issue](https://github.com/time2build-ai/time2ship/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/time2build-ai/time2ship/discussions)
- 📧 **Contact**: thiago@time2build.ai

---

<div align="center">

**Built with ❤️ using Time2Ship**

⭐ Star us on GitHub — it motivates us a lot!

</div>
