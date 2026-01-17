import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authController } from '../controllers/auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register.bind(authController)));
router.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh.bind(authController)));
router.post('/logout', validate(refreshTokenSchema), asyncHandler(authController.logout.bind(authController)));

export default router;
