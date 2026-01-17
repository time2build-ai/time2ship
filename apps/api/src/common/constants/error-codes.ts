/**
 * Central error codes for cross-cutting concerns.
 * Feature-specific codes should be defined in their respective feature directories.
 */
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION.INVALID_INPUT',
    MISSING_FIELD: 'VALIDATION.MISSING_FIELD',
    INVALID_FORMAT: 'VALIDATION.INVALID_FORMAT',
  },

  // Server errors (500)
  SERVER: {
    INTERNAL_ERROR: 'SERVER.INTERNAL_ERROR',
    DATABASE_ERROR: 'SERVER.DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVER.SERVICE_UNAVAILABLE',
  },

  // Generic errors
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Type for error codes
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
