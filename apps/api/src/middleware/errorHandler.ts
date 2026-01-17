import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/utils/errors';

/**
 * Global error handling middleware for Express application.
 * Catches all errors passed via next(error) and formats consistent error responses.
 * Distinguishes between operational errors (AppError) and unexpected errors.
 *
 * @param err - Error object (either AppError or generic Error)
 * @param req - Express request object (unused but required by Express error handler signature)
 * @param res - Express response object for sending error response
 * @param next - Express next function (unused but required by Express error handler signature)
 *
 * @example
 * // In routes or middleware:
 * throw new AppError('Invalid input', 400);
 * // OR
 * next(new AppError('User not found', 404));
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error('Unexpected error:', err);

  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(500).json({
    success: false,
    message,
  });
};
