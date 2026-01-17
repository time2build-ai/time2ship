import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/common/utils/errors';
import { ResponseHelper } from '@/common/helpers/response';
import { ERROR_CODES } from '@/common/constants/error-codes';

// Re-export AppError for convenience
export { AppError };

/**
 * Global error handling middleware for Express application.
 * Catches all errors passed via next(error) and formats consistent error responses.
 * Handles:
 * - Zod validation errors with field-level details
 * - AppError operational errors with status codes
 * - Unexpected errors (sanitized in production)
 *
 * @param err - Error object (ZodError, AppError, or generic Error)
 * @param req - Express request object (unused but required by Express error handler signature)
 * @param res - Express response object for sending error response
 * @param next - Express next function (unused but required by Express error handler signature)
 *
 * @example
 * // In routes or middleware:
 * throw new AppError('Invalid input', 400, 'VALIDATION.INVALID_INPUT');
 * // OR
 * next(new AppError('User not found', 404, 'USER.NOT_FOUND'));
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging (in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};

    // Extract field-level error messages
    err.errors.forEach((error) => {
      const field = error.path.join('.');
      details[field] = error.message;
    });

    ResponseHelper.error(
      res,
      400,
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      'Validation failed',
      details
    );
    return;
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    ResponseHelper.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details
    );
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  ResponseHelper.error(
    res,
    500,
    ERROR_CODES.SERVER.INTERNAL_ERROR,
    message
  );
};
