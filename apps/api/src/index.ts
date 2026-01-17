import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { env } from './config/env';
import featureRoutes from './features';
import { ResponseHelper } from './common/helpers/response';

dotenv.config();

const app: Application = express();
const PORT = env.PORT || 3001;

app.use(helmet());
app.use(requestIdMiddleware); // Add request ID to every request
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  ResponseHelper.success(res, {
    status: 'ok',
    uptime: process.uptime(),
  });
});

app.use('/api/v1', featureRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
    console.log(`👥 User endpoints: http://localhost:${PORT}/api/v1/users`);
  });
}

export default app;
