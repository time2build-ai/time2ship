import { Router } from 'express';
import exampleRoutes from './example.routes';

const router = Router();

// Register route modules
router.use('/example', exampleRoutes);

// Root API endpoint
router.get('/', (_req, res) => {
  res.json({
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

export default router;
