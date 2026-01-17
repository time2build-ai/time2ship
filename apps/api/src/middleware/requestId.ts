// src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to generate unique request IDs for tracing.
 * Attaches requestId to res.locals and sets X-Request-ID header.
 *
 * @example
 * app.use(requestIdMiddleware);
 */
export const requestIdMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
