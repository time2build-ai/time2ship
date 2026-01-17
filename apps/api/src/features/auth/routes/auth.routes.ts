import { Router, Request } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res) => {
    const result = await authService.register(
      req.validated!.body.email,
      req.validated!.body.password
    );
    res.status(201).json({ success: true, data: result });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res) => {
    const result = await authService.login(
      req.validated!.body.email,
      req.validated!.body.password
    );
    res.json({ success: true, data: result });
  })
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res) => {
    const result = await authService.refresh(req.validated!.body.refreshToken);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res) => {
    await authService.logout(req.validated!.body.refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  })
);

export default router;
