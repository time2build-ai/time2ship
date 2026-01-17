import { Request, Response, NextFunction } from 'express';
import { AsyncRequestHandler } from '../types';

/**
 * Wrapper for async route handlers to catch errors and pass them to error middleware
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};
