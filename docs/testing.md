# Testing

## Overview

Time2Ship includes comprehensive testing at multiple levels: unit tests, integration tests, and end-to-end (E2E) tests. The testing setup uses Jest for the test runner, Supertest for API testing, and Docker for isolated E2E environments.

## Unit & Integration Tests

### Running Tests

```bash
cd apps/api

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Watch Mode

Watch mode automatically runs tests when files change:

```bash
npm run test:watch
```

Useful commands in watch mode:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by file name
- Press `t` to filter by test name
- Press `q` to quit

### Coverage Reports

Generate and view coverage:

```bash
npm run test:coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

Coverage thresholds are configured in `jest.config.js`.

### Test Organization

Tests are colocated with features in `__tests__/` directories:

```
src/
└── features/
    └── auth/
        ├── controllers/
        ├── services/
        └── __tests__/
            ├── auth.controller.test.ts
            ├── auth.service.test.ts
            └── auth.integration.test.ts
```

**Benefits:**
- Easy to find tests related to features
- Tests move with the code they test
- Clear organization by feature

## E2E Tests

### Running E2E Tests

E2E tests run in isolated Docker containers with a separate test database:

```bash
cd apps/api

# Run E2E tests in Docker
npm run test:e2e

# Cleanup after tests
npm run test:e2e:down
```

### Docker Test Environment

E2E tests use `docker-compose.test.yml`:

- Separate test database (isolated from development)
- API container running in test mode
- Automatic cleanup after tests

### Cleanup

Always cleanup after E2E tests:

```bash
npm run test:e2e:down
```

This removes test containers and volumes.

## Writing Tests

### Best Practices

**DO:**
- ✅ Write descriptive test names
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Test one thing per test
- ✅ Use factories for test data
- ✅ Mock external services
- ✅ Clean up after tests

**DON'T:**
- ❌ Test implementation details
- ❌ Share state between tests
- ❌ Use real database in unit tests
- ❌ Skip cleanup
- ❌ Write flaky tests

### Test Structure

Use the AAA pattern (Arrange-Act-Assert):

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return user and tokens on valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const user = await createTestUser({ email, password });

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it('should throw error on invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      await createTestUser({ email, password: 'correct' });

      // Act & Assert
      await expect(
        authService.login(email, 'wrong')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Mocking

Mock external dependencies in unit tests:

```typescript
import { jest } from '@jest/globals';

// Mock email service
jest.mock('../../common/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

// Mock database
const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
};
```

### Test Factories

Create reusable test data factories:

```typescript
// test/factories/user.factory.ts
export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'Test1234!',
    name: 'Test User',
  };

  const userData = { ...defaultUser, ...overrides };
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  return db.insert(users).values({
    ...userData,
    password: hashedPassword,
  }).returning();
};
```

### Integration Tests

Test full request/response cycles:

```typescript
import request from 'supertest';
import app from '../../../app';

describe('POST /api/auth/login', () => {
  it('should login user with valid credentials', async () => {
    // Arrange
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'Test1234!'
    });

    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test1234!'
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
```

## Continuous Integration

Tests run automatically on:

- **Pre-commit** - Linting and type checking (via Husky)
- **Pre-push** - Full test suite (via Husky)
- **Pull Requests** - CI pipeline (GitHub Actions)

See [docs/HUSKY.md](HUSKY.md) for Git hooks configuration.

## Related Documentation

- [Architecture](architecture.md) - Project structure
- [Contributing](contributing.md) - Development workflow
