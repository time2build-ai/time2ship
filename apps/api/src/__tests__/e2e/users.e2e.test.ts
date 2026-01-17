import request from 'supertest';
import app from '@/index';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from './setup';
import {
  createTestUser,
  createTestUsers,
  createAuthenticatedTestUser,
} from './helpers';

describe('E2E: User Endpoints', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated list of users', async () => {
      const authUser = await createAuthenticatedTestUser();
      await createTestUsers(5);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: {
          page: 1,
          limit: 10,
          total: 6, // 5 created + 1 auth user
          totalPages: 1,
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      expect(response.body.data).toHaveLength(6);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify passwords are not included
      response.body.data.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should handle pagination correctly - page 1', async () => {
      const authUser = await createAuthenticatedTestUser();
      await createTestUsers(15);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: 16,
        totalPages: 2,
      });
    });

    it('should handle pagination correctly - page 2', async () => {
      const authUser = await createAuthenticatedTestUser();
      await createTestUsers(15);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(6);
      expect(response.body.meta).toMatchObject({
        page: 2,
        limit: 10,
        total: 16,
        totalPages: 2,
      });
    });

    it('should use default pagination when not specified', async () => {
      const authUser = await createAuthenticatedTestUser();
      await createTestUsers(3);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(20);
    });

    it('should return empty array when page exceeds total pages', async () => {
      const authUser = await createAuthenticatedTestUser();
      await createTestUsers(3);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .query({ page: 10, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta).toMatchObject({
        page: 10,
        limit: 10,
        total: 4,
        totalPages: 1,
      });
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTH.TOKEN_INVALID',
          message: 'No token provided',
        },
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH.TOKEN_INVALID');
    });

    it('should return 400 for invalid page number', async () => {
      const authUser = await createAuthenticatedTestUser();

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .query({ page: -1, limit: 10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 400 for invalid limit value', async () => {
      const authUser = await createAuthenticatedTestUser();

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .query({ page: 1, limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by ID', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser('target@example.com', 'Password123!');

      const response = await request(app)
        .get(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: targetUser.id,
          email: 'target@example.com',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Verify password is not included
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const authUser = await createAuthenticatedTestUser();
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'USER.NOT_FOUND',
          message: 'User not found',
        },
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const authUser = await createAuthenticatedTestUser();

      const response = await request(app)
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 401 without authentication token', async () => {
      const user = await createTestUser();

      const response = await request(app).get(`/api/v1/users/${user.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH.TOKEN_INVALID');
      expect(response.body.error.message).toBe('No token provided');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user email', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser('old@example.com', 'Password123!');

      const response = await request(app)
        .put(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          email: 'new@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'User updated successfully',
        data: {
          id: targetUser.id,
          email: 'new@example.com',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Verify password is not included
      expect(response.body.data.password).toBeUndefined();
    });

    it('should update user password', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser('user@example.com', 'OldPass123!');

      const response = await request(app)
        .put(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          password: 'NewPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'User updated successfully',
        data: {
          id: targetUser.id,
          email: 'user@example.com',
        },
      });

      // Verify new password works by logging in
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'NewPass123!',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should update both email and password', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser('user@example.com', 'OldPass123!');

      const response = await request(app)
        .put(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          email: 'updated@example.com',
          password: 'NewPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('updated@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const authUser = await createAuthenticatedTestUser();
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          email: 'new@example.com',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER.NOT_FOUND');
    });

    it('should return 400 for invalid email format', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser();

      const response = await request(app)
        .put(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 400 for password too short', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser();

      const response = await request(app)
        .put(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 400 for invalid UUID format', async () => {
      const authUser = await createAuthenticatedTestUser();

      const response = await request(app)
        .put('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          email: 'new@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 401 without authentication token', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .put(`/api/v1/users/${user.id}`)
        .send({
          email: 'new@example.com',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH.TOKEN_INVALID');
      expect(response.body.error.message).toBe('No token provided');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user successfully', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser('delete@example.com', 'Password123!');

      const response = await request(app)
        .delete(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: null,
        message: 'User deleted successfully',
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 404 when trying to get deleted user', async () => {
      const authUser = await createAuthenticatedTestUser();
      const targetUser = await createTestUser('delete@example.com', 'Password123!');

      // Delete the user
      await request(app)
        .delete(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      // Try to get the deleted user
      const response = await request(app)
        .get(`/api/v1/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('USER.NOT_FOUND');
    });

    it('should return 404 for non-existent user', async () => {
      const authUser = await createAuthenticatedTestUser();
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'USER.NOT_FOUND',
          message: 'User not found',
        },
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const authUser = await createAuthenticatedTestUser();

      const response = await request(app)
        .delete('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${authUser.accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION.INVALID_INPUT');
    });

    it('should return 401 without authentication token', async () => {
      const user = await createTestUser();

      const response = await request(app).delete(`/api/v1/users/${user.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH.TOKEN_INVALID');
      expect(response.body.error.message).toBe('No token provided');
    });
  });
});
