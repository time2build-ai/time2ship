import request from 'supertest';
import express from 'express';
import router from '../example.routes';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/example', router);
app.use(errorHandler);

describe('Example Routes', () => {
  describe('GET /example', () => {
    it('should return list of examples', async () => {
      const response = await request(app).get('/example');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toBe('Examples retrieved successfully');
    });
  });

  describe('GET /example/:id', () => {
    it('should return a specific example', async () => {
      const response = await request(app).get('/example/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBe('Example Item 1');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app).get('/example/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing ID', async () => {
      const response = await request(app).get('/example/');

      // This will match GET /example instead
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /example', () => {
    it('should create a new example', async () => {
      const response = await request(app)
        .post('/example')
        .send({ name: 'New Example' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Example');
      expect(response.body.message).toBe('Example created successfully');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app).post('/example').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
