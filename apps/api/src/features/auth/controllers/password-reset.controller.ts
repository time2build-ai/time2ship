import { Request, Response } from 'express';
import { passwordResetService } from '../services/password-reset.service';
import { ResponseHelper } from '@/common/helpers/response';

/**
 * Controller handling password reset HTTP requests.
 * Manages forgot password, OTP verification, and password reset endpoints.
 */
export class PasswordResetController {
  /**
   * Initiates password reset by sending OTP to user's email
   *
   * @param req - Express request with validated body containing email
   * @param res - Express response object
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    await passwordResetService.requestPasswordReset(req.validated!.body.email);
    ResponseHelper.success(res, {
      message: "If an account exists with that email, you'll receive a code",
    });
  }

  /**
   * Verifies OTP and returns reset token
   *
   * @param req - Express request with validated body containing email and OTP
   * @param res - Express response object
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    const resetToken = await passwordResetService.verifyOTP(
      req.validated!.body.email,
      req.validated!.body.otp
    );
    ResponseHelper.success(res, { resetToken });
  }

  /**
   * Resets user password using valid reset token
   *
   * @param req - Express request with validated body containing reset token and new password
   * @param res - Express response object
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    await passwordResetService.resetPassword(
      req.validated!.body.resetToken,
      req.validated!.body.password
    );
    ResponseHelper.success(res, { message: 'Password reset successfully' });
  }
}

export const passwordResetController = new PasswordResetController();
