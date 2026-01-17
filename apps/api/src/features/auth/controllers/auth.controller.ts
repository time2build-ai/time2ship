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
}

export const authController = new AuthController();
