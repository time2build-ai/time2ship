/**
 * Base application error class for operational errors.
 * Used for expected errors that should be handled gracefully (validation, not found, etc.).
 *
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (defaults to 500)
 *
 * @example
 * throw new AppError('Service temporarily unavailable', 503);
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource does not exist.
 * Returns 404 HTTP status code.
 *
 * @param resource - Name of the resource that was not found
 *
 * @example
 * throw new NotFoundError('User');
 * // Results in: "User not found" with status 404
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

/**
 * Error thrown when authentication is required or credentials are invalid.
 * Returns 401 HTTP status code.
 *
 * @param message - Error message (defaults to 'Unauthorized')
 *
 * @example
 * throw new UnauthorizedError('Invalid token');
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate entries).
 * Returns 409 HTTP status code.
 *
 * @param message - Description of the conflict
 *
 * @example
 * throw new ConflictError('User with this email already exists');
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Error thrown when request validation fails.
 * Returns 400 HTTP status code.
 *
 * @param message - Description of the validation failure
 *
 * @example
 * throw new ValidationError('Email format is invalid');
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
