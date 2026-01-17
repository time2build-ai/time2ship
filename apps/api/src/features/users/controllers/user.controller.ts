// apps/api/src/features/users/controllers/user.controller.ts
import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ResponseHelper } from '@/common/helpers/response';

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  }
}

export const userController = new UserController();
