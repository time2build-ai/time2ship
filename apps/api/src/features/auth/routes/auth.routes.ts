import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authRateLimit, passwordResetRateLimit } from '@/middleware/rateLimit';
import { authSlowDown } from '@/middleware/slowDown';
import { authController } from '../controllers/auth.controller';
import { passwordResetController } from '../controllers/password-reset.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators';
import {
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '../validators/password-reset.validators';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/login',
  authSlowDown,
  authRateLimit,
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(authController.refresh.bind(authController))
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(authController.logout.bind(authController))
);

// Password reset routes
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler(passwordResetController.forgotPassword.bind(passwordResetController))
);
router.post(
  '/verify-reset-otp',
  passwordResetRateLimit,
  validate(verifyResetOtpSchema),
  asyncHandler(passwordResetController.verifyOtp.bind(passwordResetController))
);
router.post(
  '/reset-password',
  passwordResetRateLimit,
  validate(resetPasswordSchema),
  asyncHandler(passwordResetController.resetPassword.bind(passwordResetController))
);

export default router;
