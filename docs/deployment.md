# Deployment

## Overview

This guide covers deploying Time2Ship to production. The boilerplate supports multiple deployment strategies: Docker-based deployments, platform-specific deployments (Vercel, Railway, Render), and custom infrastructure.

## Building for Production

### API Build

```bash
cd apps/api
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Client Build

```bash
cd apps/client
npm run build
```

This creates an optimized production build in the `.next/` folder.

## Docker Production

### Using docker-compose.prod.yml

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

### Production Environment Variables

⚠️ **Critical**: Update all environment variables for production:

**Security:**
- Generate new JWT secrets: `openssl rand -base64 32`
- Use strong database passwords
- Set `NODE_ENV=production`

**URLs:**
- Update `CLIENT_URL` to your production domain
- Update `API_URL` to your production API domain

**Database:**
- Use managed database service (not Docker in production)
- Enable SSL connections
- Set up automated backups

**Email:**
- Configure production email service
- Use transactional email provider (SendGrid, Mailgun, etc.)

## Platform-Specific Guides

### Vercel (Client)

Vercel is ideal for the Next.js client:

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Deploy from apps/client**

```bash
cd apps/client
vercel --prod
```

**Step 3: Configure Environment Variables**

In Vercel dashboard:
- `NEXT_PUBLIC_API_URL` - Your production API URL
- `API_URL` - Internal API URL (if using Vercel Functions)

**Step 4: Custom Domain**

- Add domain in Vercel dashboard
- Configure DNS records
- SSL is automatic

### Railway (API)

Railway is great for the Express API:

**Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

**Step 2: Login and Initialize**

```bash
railway login
railway init
```

**Step 3: Deploy**

```bash
cd apps/api
railway up
```

**Step 4: Add PostgreSQL**

In Railway dashboard:
- Add PostgreSQL plugin
- Copy connection variables
- Add to environment variables

**Step 5: Configure Environment**

Set all environment variables in Railway dashboard.

### Render (API)

**Step 1: Create Web Service**

In Render dashboard:
- New > Web Service
- Connect GitHub repository
- Select `apps/api` as root directory

**Step 2: Configure Build**

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Step 3: Add PostgreSQL**

- New > PostgreSQL
- Copy internal connection string
- Add as `DATABASE_URL` environment variable

**Step 4: Environment Variables**

Add all required variables in Render dashboard.

## Database Hosting

### Recommended Providers

**Managed PostgreSQL:**
- **Neon** - Serverless PostgreSQL (free tier available)
- **Supabase** - PostgreSQL + extras (free tier available)
- **Railway** - Simple PostgreSQL (hobby plan)
- **Render** - Managed PostgreSQL
- **AWS RDS** - Enterprise-grade

### Database Setup

**Step 1: Create Database**

Create production database in chosen provider.

**Step 2: Run Migrations**

```bash
cd apps/api

# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npm run db:migrate
```

**Step 3: Seed (Optional)**

```bash
# Only seed if you need initial data
npm run db:seed
```

⚠️ **Warning**: Don't seed test users in production!

## Production Checklist

### Security

- [ ] Generate new JWT secrets
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL everywhere
- [ ] Configure CORS for production domains
- [ ] Set secure cookie flags
- [ ] Remove test/seed data
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging

### Environment Variables

- [ ] Update all URLs to production domains
- [ ] Configure production email service
- [ ] Set `NODE_ENV=production`
- [ ] Review all API keys and secrets
- [ ] Enable database SSL

### Database

- [ ] Use managed database service
- [ ] Enable automated backups
- [ ] Run migrations before deploy
- [ ] Set up monitoring
- [ ] Configure connection pooling

### Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Enable database monitoring
- [ ] Configure alerts

### Performance

- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable compression
- [ ] Set up load balancing (if needed)

## CI/CD Pipeline

### Dokploy Deployment (Included)

Time2Ship includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) for automatic deployment to Dokploy via webhook.

**How it works:**
1. Push to `production` branch triggers the workflow
2. Builds Docker images for API and Client
3. Pushes images to Docker Hub
4. Triggers Dokploy webhook for automatic deployment

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `DOCKERHUB_API_IMAGE` | Docker Hub image name for API (e.g., `username/time2ship-api`) |
| `DOCKERHUB_CLIENT_IMAGE` | Docker Hub image name for Client (e.g., `username/time2ship-client`) |
| `DOKPLOY_WEBHOOK_URL` | Your Dokploy deployment webhook URL |

**Setup Steps:**

1. **Configure GitHub Secrets**
   - Go to your repository Settings > Secrets and variables > Actions
   - Add all required secrets listed above

2. **Create Dokploy Application**
   - Set up your application in Dokploy
   - Configure it to pull from Docker Hub
   - Copy the deployment webhook URL

3. **Deploy**
   - Push to `production` branch
   - GitHub Actions builds and pushes Docker images
   - Dokploy automatically pulls and deploys new images

**Workflow File:** `.github/workflows/deploy.yml`

**Manual Trigger:** You can also manually trigger deployment from the Actions tab

### Custom GitHub Actions Example

If not using Dokploy, here's a basic template:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd apps/api && npm install
      - run: cd apps/api && npm run build
      - run: cd apps/api && npm test
      # Add deployment steps for your platform

  deploy-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd apps/client && npm install
      - run: cd apps/client && npm run build
      # Add deployment steps for your platform
```

## Rollback Strategy

### Docker Deployments

```bash
# Tag images before deploying
docker tag myapp:latest myapp:v1.2.3

# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker tag myapp:v1.2.2 myapp:latest
docker-compose -f docker-compose.prod.yml up -d
```

### Platform Deployments

Most platforms (Vercel, Railway, Render) support one-click rollbacks in their dashboards.

## Post-Deployment

### Verify Deployment

- [ ] Test API health endpoint
- [ ] Test client homepage loads
- [ ] Test authentication flow
- [ ] Check database connection
- [ ] Verify email sending
- [ ] Test critical user flows

### Monitor

- [ ] Check error rates
- [ ] Monitor response times
- [ ] Watch database performance
- [ ] Review logs for issues

## Related Documentation

- [Getting Started](getting-started.md) - Development setup
- [Architecture](architecture.md) - System architecture
- [Testing](testing.md) - Running tests before deploy
