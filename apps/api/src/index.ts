import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { loggingMiddleware } from './middleware/logging';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import featureRoutes from './features';
import { ResponseHelper } from './common/helpers/response';
import logger from './common/utils/logger';
import { runMigrations } from './db/migrate';

const app: Application = express();
const PORT = env.PORT || 3001;

app.use(helmet());
app.use(requestIdMiddleware); // Add request ID to every request
app.use(loggingMiddleware); // Winston-based HTTP request logging
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  ResponseHelper.success(res, {
    status: 'ok',
    uptime: process.uptime(),
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', featureRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Run migrations before starting the server
  runMigrations()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`🚀 Server is running on port ${PORT}`);
        logger.info(`📍 Environment: ${env.NODE_ENV}`);
        logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
        logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
        logger.info(`👥 User endpoints: http://localhost:${PORT}/api/v1/users`);
      });
    })
    .catch((error) => {
      logger.error('Failed to start server due to migration error:', error);
      process.exit(1);
    });
}

export default app;
