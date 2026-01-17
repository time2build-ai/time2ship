/**
 * Base application error class for operational errors.
 * Used for expected errors that should be handled gracefully (validation, not found, etc.).
 *
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (defaults to 500)
 * @param code - Machine-readable error code (e.g., 'AUTH.INVALID_CREDENTIALS')
 * @param details - Optional field-level error details
 *
 * @example
 * throw new AppError('Service temporarily unavailable', 503, 'SERVER.SERVICE_UNAVAILABLE');
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'SERVER.INTERNAL_ERROR',
    details?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource does not exist.
 * Returns 404 HTTP status code.
 *
 * @param resource - Name of the resource that was not found
 * @param code - Optional custom error code (defaults to 'NOT_FOUND')
 *
 * @example
 * throw new NotFoundError('User');
 * throw new NotFoundError('User', 'USER.NOT_FOUND');
 */
export class NotFoundError extends AppError {
  constructor(resource: string, code: string = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
  }
}

/**
 * Error thrown when authentication is required or credentials are invalid.
 * Returns 401 HTTP status code.
 *
 * @param message - Error message (defaults to 'Unauthorized')
 * @param code - Machine-readable error code
 *
 * @example
 * throw new UnauthorizedError('Invalid token', 'AUTH.TOKEN_INVALID');
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string) {
    super(message, 401, code);
  }
}

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate entries).
 * Returns 409 HTTP status code.
 *
 * @param message - Description of the conflict
 * @param code - Machine-readable error code
 *
 * @example
 * throw new ConflictError('User with this email already exists', 'AUTH.EMAIL_ALREADY_EXISTS');
 */
export class ConflictError extends AppError {
  constructor(message: string, code: string) {
    super(message, 409, code);
  }
}

/**
 * Error thrown when request validation fails.
 * Returns 400 HTTP status code.
 *
 * @param message - Description of the validation failure
 * @param code - Machine-readable error code (defaults to 'VALIDATION.INVALID_INPUT')
 * @param details - Optional field-level validation errors
 *
 * @example
 * throw new ValidationError('Validation failed', 'VALIDATION.INVALID_INPUT', {
 *   email: 'Invalid email format',
 *   password: 'Must be at least 8 characters'
 * });
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: string = 'VALIDATION.INVALID_INPUT',
    details?: Record<string, string>
  ) {
    super(message, 400, code, details);
  }
}
