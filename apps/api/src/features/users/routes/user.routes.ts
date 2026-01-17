import { Router, Request } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authenticate, AuthRequest } from '@/features/auth/middleware/authenticate';
import { userService } from '../services/user.service';
import { getUserSchema, updateUserSchema, listUsersSchema } from '../validators/user.validators';
import { ResponseHelper } from '@/common/helpers/response';

const router = Router();

router.use(authenticate);

// List users with pagination
router.get(
  '/',
  validate(listUsersSchema),
  asyncHandler(async (req: Request, res) => {
    const { users, meta } = await userService.findAll(req.query);
    ResponseHelper.success(res, users, undefined, meta);
  })
);

router.get(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.findById(req.params.id);
    ResponseHelper.success(res, user);
  })
);

router.put(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.update(req.params.id, req.validated!.body);
    ResponseHelper.success(res, user, 'User updated successfully');
  })
);

router.delete(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    await userService.delete(req.params.id);
    ResponseHelper.success(res, null, 'User deleted successfully');
  })
);

export default router;
