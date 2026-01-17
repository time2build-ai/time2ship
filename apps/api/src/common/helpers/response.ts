// src/common/helpers/response.ts
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Utility class for sending consistent API responses.
 * All responses include timestamp and requestId for tracing.
 */
export class ResponseHelper {
  /**
   * Send a successful response (200 OK)
   *
   * @param res - Express response object
   * @param data - Response data
   * @param message - Optional success message
   * @param meta - Optional pagination metadata
   *
   * @example
   * ResponseHelper.success(res, user);
   * ResponseHelper.success(res, users, undefined, paginationMeta);
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    meta?: PaginationMeta
  ): void {
    res.json({
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    });
  }

  /**
   * Send a resource created response (201 Created)
   *
   * @param res - Express response object
   * @param data - Created resource data
   * @param message - Optional success message
   *
   * @example
   * ResponseHelper.created(res, newUser, 'User created successfully');
   */
  static created<T>(
    res: Response,
    data: T,
    message?: string
  ): void {
    res.status(201).json({
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    });
  }

  /**
   * Send an error response
   *
   * @param res - Express response object
   * @param statusCode - HTTP status code
   * @param code - Machine-readable error code (e.g., 'AUTH.INVALID_CREDENTIALS')
   * @param message - Human-readable error message
   * @param details - Optional field-level error details
   *
   * @example
   * ResponseHelper.error(res, 404, 'USER.NOT_FOUND', 'User not found');
   * ResponseHelper.error(res, 400, 'VALIDATION.INVALID_INPUT', 'Validation failed', { email: 'Invalid format' });
   */
  static error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string>
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
    });
  }
}
