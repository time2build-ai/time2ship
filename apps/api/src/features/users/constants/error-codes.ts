/**
 * Error codes specific to user management feature.
 */
export const USER_ERROR_CODES = {
  NOT_FOUND: 'USER.NOT_FOUND',
  ALREADY_EXISTS: 'USER.ALREADY_EXISTS',
  CANNOT_DELETE_SELF: 'USER.CANNOT_DELETE_SELF',
} as const;

export type UserErrorCode = typeof USER_ERROR_CODES[keyof typeof USER_ERROR_CODES];
