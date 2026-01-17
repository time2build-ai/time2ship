import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { UnauthorizedError } from '@/common/utils/errors';
import { AUTH_ERROR_CODES } from '../constants/error-codes';

/**
 * Extended Express Request with authenticated user information.
 * Available after successful authentication middleware execution.
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Authentication middleware that verifies JWT access tokens.
 * Extracts token from Authorization header (Bearer format).
 * Attaches decoded user information to request.user if valid.
 *
 * @throws {AppError} If token is missing, malformed, invalid, or expired
 *
 * @example
 * router.get('/protected', authenticate, (req: AuthRequest, res) => {
 *   console.log(req.user.userId); // Authenticated user ID
 * });
 */
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided', AUTH_ERROR_CODES.TOKEN_INVALID);
    }

    const token = authHeader.substring(7);

    const decoded = tokenService.verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};
