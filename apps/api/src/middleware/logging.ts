import { Request, Response, NextFunction } from 'express';
import logger from '@/common/utils/logger';

/**
 * HTTP request logging middleware using Winston.
 * Logs all HTTP requests with method, URL, status code, response time, and request ID.
 *
 * Replaces morgan with Winston for consistent logging across the application.
 *
 * @example
 * app.use(loggingMiddleware);
 */
export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    requestId: res.locals.requestId,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(logLevel, 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: res.locals.requestId,
      ip: req.ip,
    });
  });

  next();
};
