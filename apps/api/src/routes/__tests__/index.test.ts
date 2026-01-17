import request from 'supertest';
import express from 'express';
import router from '../index';

const app = express();
app.use(express.json());
app.use('/', router);

describe('Root Routes', () => {
  it('should return API information on root endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'API is running',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api',
        example: '/api/example',
      },
    });
  });
});
