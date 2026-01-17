import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ResponseHelper } from '@/common/helpers/response';

/**
 * Controller handling authentication HTTP requests.
 * Manages user registration, login, token refresh, and logout endpoints.
 */
export class AuthController {
  /**
   * Registers a new user with email and password.
   *
   * @param req - Express request with validated body containing email and password
   * @param res - Express response object
   */
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.created(res, result, 'User registered successfully');
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param req - Express request with validated body containing email and password
   * @param res - Express response object
   */
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(
      req.validated!.body.email,
      req.validated!.body.password
    );
    ResponseHelper.success(res, result);
  }

  /**
   * Rotates tokens using a valid refresh token.
   *
   * @param req - Express request with validated body containing refresh token
   * @param res - Express response object
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(req.validated!.body.refreshToken);
    ResponseHelper.success(res, result);
  }

  /**
   * Logs out a user by revoking their refresh token.
   *
   * @param req - Express request with validated body containing refresh token
   * @param res - Express response object
   */
  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.validated!.body.refreshToken);
    ResponseHelper.success(res, null, 'Logged out successfully');
  }
}

export const authController = new AuthController();
