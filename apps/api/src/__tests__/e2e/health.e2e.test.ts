import request from 'supertest';
import app from '@/index';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from './setup';

describe('E2E: Health Check Endpoint', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'ok',
          uptime: expect.any(Number),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return valid timestamp in ISO format', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should include request ID in response', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.requestId).toBeTruthy();
      expect(typeof response.body.requestId).toBe('string');
    });

    it('should return positive uptime value', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });
  });
});
