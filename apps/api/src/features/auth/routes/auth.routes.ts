import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authController } from '../controllers/auth.controller';
import { passwordResetController } from '../controllers/password-reset.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';
import {
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '../validators/password-reset.validators';

const router = Router();

// Authentication routes
router.post('/register', validate(registerSchema), asyncHandler(authController.register.bind(authController)));
router.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh.bind(authController)));
router.post('/logout', validate(refreshTokenSchema), asyncHandler(authController.logout.bind(authController)));

// Password reset routes
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(passwordResetController.forgotPassword.bind(passwordResetController)));
router.post('/verify-reset-otp', validate(verifyResetOtpSchema), asyncHandler(passwordResetController.verifyOtp.bind(passwordResetController)));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(passwordResetController.resetPassword.bind(passwordResetController)));

export default router;
