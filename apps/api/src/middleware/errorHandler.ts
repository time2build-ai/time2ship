import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/common/utils/errors';
import { ResponseHelper } from '@/common/helpers/response';
import { ERROR_CODES } from '@/common/constants/error-codes';
import logger from '@/common/utils/logger';

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
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error with appropriate level
  const logMeta = {
    requestId: res.locals.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
  };

  if (err instanceof ZodError) {
    logger.warn('Validation error', { ...logMeta, error: err.issues });
  } else if (err instanceof AppError) {
    // Log operational errors as warnings, except 5xx errors
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    logger.log(logLevel, err.message, {
      ...logMeta,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
      stack: err.stack,
    });
  } else {
    // Log unexpected errors with full stack trace
    logger.error('Unexpected error', {
      ...logMeta,
      error: err.message,
      stack: err.stack,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};

    // Extract field-level error messages
    err.issues.forEach((issue) => {
      const field = issue.path.join('.');
      details[field] = issue.message;
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
