# Getting Started with Time2Ship

## Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js** 20+ ([Download](https://nodejs.org/))
- ✅ **npm** or **yarn**
- ✅ **Docker** & **Docker Compose** ([Download](https://www.docker.com/get-started))
- ✅ **PostgreSQL** (optional - only if running locally without Docker)

## Installation Options

### Option 1: Using create-time2ship (Recommended)

The fastest way to start a new project:

```bash
npx create-time2ship my-app
cd my-app
npm install
```

This scaffolds a complete project with all dependencies configured.

### Option 2: Clone Directly (For Customization)

If you want to customize the boilerplate itself:

```bash
git clone <repository-url>
cd time2ship
npm install
```

> 💡 **Note:** Most users should use Option 1. Only clone directly if you're contributing to the boilerplate or need deep customization.

## Development Setup

### Docker (Recommended)

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

### Local Development

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

## Environment Variables

### API Configuration (apps/api/.env)

```bash
# Copy example file
cd apps/api
cp .env.example .env
```

Configure the following variables:

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

### Client Configuration (apps/client/.env)

```bash
# Copy example file
cd apps/client
cp .env.example .env
```

Configure the following variables:

```env
# 🌐 API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001  # Browser requests
API_URL=http://api:3001                     # Server-side (Docker)
```

> 💡 **Note**: `NEXT_PUBLIC_` variables are exposed to the browser

## Database Management

### Migrations

```bash
cd apps/api

# 📝 Generate migrations from schema changes
npm run db:generate

# 🚀 Apply migrations to database
npm run db:migrate
```

### Seeding

```bash
cd apps/api

# 🌱 Seed database with sample data
npm run db:seed
```

#### Default Seeded Users

After running `npm run db:seed`, the following test users will be available:

| Email                | Password     | Role       |
| -------------------- | ------------ | ---------- |
| `test@time2ship.ai`  | `Test1234!`  | Test User  |
| `admin@time2ship.ai` | `Admin1234!` | Admin User |

> 🔒 **Security Note**: Change these credentials in production!

### Drizzle Studio

Open a visual database editor:

```bash
cd apps/api
npm run db:studio
```

Drizzle Studio provides a beautiful UI to view and edit your database at `https://local.drizzle.studio`

## Available Scripts

### Root Level Commands

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run prepare` | 🔧 Install Husky hooks          |
| `npm run review`  | 👀 Review changes before commit |

### Client App (apps/client)

| Command         | Description                 |
| --------------- | --------------------------- |
| `npm run dev`   | 🚀 Start development server |
| `npm run build` | 📦 Build for production     |
| `npm start`     | ▶️ Start production server  |
| `npm run lint`  | 🔍 Run ESLint               |

### API App (apps/api)

#### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start dev server with hot reload |
| `npm run build` | 📦 Build TypeScript |
| `npm start` | ▶️ Start production server |
| `npm run lint` | 🔍 Run ESLint |
| `npm run type-check` | ✅ Type check without building |

#### Testing

| Command | Description |
|---------|-------------|
| `npm test` | 🧪 Run unit tests |
| `npm run test:watch` | 👀 Run tests in watch mode |
| `npm run test:coverage` | 📊 Generate coverage report |
| `npm run test:e2e` | 🔬 Run E2E tests in Docker |

#### Database

| Command | Description |
|---------|-------------|
| `npm run db:generate` | 📝 Generate migrations |
| `npm run db:migrate` | 🚀 Apply migrations |
| `npm run db:studio` | 🎨 Open Drizzle Studio |
| `npm run db:seed` | 🌱 Seed database |

## Troubleshooting

### Port Already in Use

If you see "Port 3000/3001 already in use":

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

If you can't connect to PostgreSQL:

1. Ensure Docker is running: `docker ps`
2. Check database container: `docker-compose logs db`
3. Verify environment variables in `apps/api/.env`

### Hot Reload Not Working

If changes aren't reflecting:

1. Restart the development server
2. Clear Next.js cache: `rm -rf apps/client/.next`
3. Clear node_modules: `rm -rf node_modules && npm install`

### Docker Build Failures

If Docker builds fail:

```bash
# Clean up Docker resources
docker-compose down
docker system prune -a

# Rebuild from scratch
docker-compose up --build
```

### Need More Help?

- 🐛 **Bug Reports**: [Open an issue](https://github.com/time2build-ai/time2ship/issues)
- 💡 **Questions**: [Start a discussion](https://github.com/time2build-ai/time2ship/discussions)
- 📧 **Contact**: thiago@time2build.ai
