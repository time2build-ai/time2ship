import request from 'supertest';
import app from '@/index';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from './setup';
import {
  createTestUser,
  createAuthenticatedTestUser,
  createExpiredRefreshToken,
  createRevokedRefreshToken,
} from './helpers';

describe('E2E: Auth Endpoints', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: expect.any(String),
            email: 'newuser@example.com',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Verify password is not included in response
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION.INVALID_INPUT',
          message: 'Validation failed',
          details: expect.any(Object),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 409 when email already exists', async () => {
      await createTestUser('existing@example.com', 'Password123!');

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'NewPassword123!',
        });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'User with this email already exists',
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createTestUser('login@example.com', 'Password123!');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(String),
            email: 'login@example.com',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Verify password is not included in response
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTH.INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 401 for invalid password', async () => {
      await createTestUser('test@example.com', 'CorrectPassword123!');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTH.INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const user = await createAuthenticatedTestUser();

      // Wait to ensure different JWT timestamp (JWT uses seconds precision)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: user.refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // New tokens should be different from old ones
      expect(response.body.data.accessToken).not.toBe(user.accessToken);
      expect(response.body.data.refreshToken).not.toBe(user.refreshToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTH.REFRESH_TOKEN_INVALID',
          message: 'Invalid or revoked refresh token',
        },
      });
    });

    it('should return 401 for revoked refresh token', async () => {
      const user = await createTestUser();
      const revokedToken = await createRevokedRefreshToken(user.id);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: revokedToken,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH.REFRESH_TOKEN_INVALID');
    });

    it('should return 401 for expired refresh token', async () => {
      const user = await createTestUser();
      const expiredToken = await createExpiredRefreshToken(user.id);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: expiredToken,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH.REFRESH_TOKEN_INVALID');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const user = await createAuthenticatedTestUser();

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken: user.refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: null,
        message: 'Logged out successfully',
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should not fail when logging out with already revoked token', async () => {
      const user = await createTestUser();
      const revokedToken = await createRevokedRefreshToken(user.id);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken: revokedToken,
        });

      // Should still succeed even if token is already revoked
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should prevent using refresh token after logout', async () => {
      const user = await createAuthenticatedTestUser();

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken: user.refreshToken,
        });

      // Try to use the same refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: user.refreshToken,
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH.REFRESH_TOKEN_INVALID');
    });
  });
});
