import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authenticate, AuthRequest } from '@/features/auth/middleware/authenticate';
import { userService } from '../services/user.service';
import { getUserSchema, updateUserSchema } from '../validators/user.validators';

const router = Router();

router.use(authenticate);

router.get(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  })
);

router.put(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.update(req.params.id, req.validated!.body);
    res.json({ success: true, data: user });
  })
);

router.delete(
  '/:id',
  validate(getUserSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    await userService.delete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  })
);

export default router;
