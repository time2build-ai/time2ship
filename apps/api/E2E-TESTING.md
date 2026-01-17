# E2E Testing Guide

This document explains how to run End-to-End (E2E) tests for the API using Docker.

## Overview

The E2E testing setup uses Docker Compose to create an isolated testing environment with:
- A dedicated PostgreSQL test database (`time2ship_test`)
- The API application configured for testing
- Automatic database migrations before tests run

## Running E2E Tests

### Using Docker (Recommended)

From the `apps/api` directory, run:

```bash
npm run test:e2e
```

This command will:
1. Build the API Docker image
2. Start a fresh PostgreSQL test database
3. Run database migrations
4. Execute all E2E tests
5. Shut down containers after tests complete

### Cleanup After Tests

To remove test containers and volumes:

```bash
npm run test:e2e:down
```

### Local E2E Tests (Without Docker)

If you have a local test database running, you can run E2E tests locally:

```bash
npm run test:e2e:local
```

**Requirements:**
- PostgreSQL running locally on port 5432
- Database named `time2ship_test`
- Environment variables set (or use `.env.test` file)

## Test Configuration

E2E tests use a dedicated Jest configuration: [jest.e2e.config.js](jest.e2e.config.js)

Key settings:
- **Sequential execution**: Tests run one at a time (`maxWorkers: 1`) to avoid database conflicts
- **Extended timeout**: 30 seconds per test
- **Pattern matching**: Only runs `*.e2e.test.ts` files in `__tests__/e2e/` directory
- **Force exit**: Ensures tests don't hang after completion

## Test Database

The test database configuration (from [docker-compose.test.yml](../../docker-compose.test.yml)):

- **Database**: `time2ship_test`
- **Port**: `5433:5432` (external:internal)
- **Storage**: Uses `tmpfs` for faster tests (data not persisted)
- **Health checks**: Ensures database is ready before running tests

## Environment Variables

The following environment variables are set in the test environment:

```bash
NODE_ENV=test
DB_HOST=db-test
DB_PORT=5432
DB_NAME=time2ship_test
DB_USER=postgres
DB_PASSWORD=postgres
JWT_ACCESS_SECRET=test-access-secret-for-e2e-testing-only
JWT_REFRESH_SECRET=test-refresh-secret-for-e2e-testing-only
```

## Test Files

E2E test files are located in:
```
src/__tests__/e2e/
├── setup.ts              # Test database setup and teardown
├── helpers.ts            # Test helper functions
├── auth.e2e.test.ts      # Authentication E2E tests
├── users.e2e.test.ts     # User management E2E tests
└── health.e2e.test.ts    # Health check E2E tests
```

## Writing E2E Tests

E2E tests should:
1. Test complete API workflows (e.g., register → login → access protected route)
2. Use the test database setup from `setup.ts`
3. Clean up data after each test using `cleanDatabase()`
4. Follow the naming convention: `*.e2e.test.ts`

Example:
```typescript
import request from 'supertest';
import app from '@/app';
import { cleanDatabase } from './setup';

describe('User E2E Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should register and login a user', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(registerRes.status).toBe(201);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('accessToken');
  });
});
```

## Troubleshooting

### Tests hang or don't exit
- Check for unclosed database connections
- Ensure all async operations are awaited
- Use `forceExit: true` in Jest config

### Database connection errors
- Verify PostgreSQL is running: `docker-compose -f ../../docker-compose.test.yml ps`
- Check database health: `docker-compose -f ../../docker-compose.test.yml logs db-test`
- Ensure migrations ran successfully

### Port conflicts
- The test database uses port `5433` externally
- The test API uses port `3002` externally
- Stop dev services if they conflict: `docker-compose down`

## CI/CD Integration

To run E2E tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    cd apps/api
    npm run test:e2e
    npm run test:e2e:down
```
