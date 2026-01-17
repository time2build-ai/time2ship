// apps/api/src/features/users/controllers/user.controller.ts
import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ResponseHelper } from '@/common/helpers/response';

/**
 * Controller handling user-related HTTP requests.
 * Manages user listing, retrieval, and profile operations.
 */
export class UserController {
  /**
   * Retrieves a paginated list of users with optional filtering.
   * Query parameters are validated by the validate middleware before reaching this method.
   *
   * @param req - Express request with validated query parameters (page, limit, etc.)
   * @param res - Express response object
   * @returns Paginated list of users with metadata
   */
  async list(req: Request, res: Response): Promise<void> {
    // Query parameters are already validated by the validate middleware
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  }
}

export const userController = new UserController();
