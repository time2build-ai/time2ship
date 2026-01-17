import { Request, Response } from 'express';
import { PasswordResetController } from '../controllers/password-reset.controller';
import { passwordResetService } from '../services/password-reset.service';
import { ResponseHelper } from '@/common/helpers/response';

jest.mock('../services/password-reset.service');
jest.mock('@/common/helpers/response');

describe('PasswordResetController', () => {
  let controller: PasswordResetController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PasswordResetController();
    mockRequest = {
      validated: {
        body: {},
      },
    };
    mockResponse = {};
  });

  describe('forgotPassword', () => {
    it('should call service and return success message', async () => {
      mockRequest.validated!.body = { email: 'test@example.com' };
      (passwordResetService.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);

      await controller.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        { message: "If an account exists with that email, you'll receive a code" }
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return reset token', async () => {
      mockRequest.validated!.body = { email: 'test@example.com', otp: '123456' };
      (passwordResetService.verifyOTP as jest.Mock).mockResolvedValue('mock.reset.token');

      await controller.verifyOtp(mockRequest as Request, mockResponse as Response);

      expect(passwordResetService.verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        { resetToken: 'mock.reset.token' }
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return success message', async () => {
      mockRequest.validated!.body = { resetToken: 'valid.token', password: 'NewPass123!' };
      (passwordResetService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      await controller.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(passwordResetService.resetPassword).toHaveBeenCalledWith('valid.token', 'NewPass123!');
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        { message: 'Password reset successfully' }
      );
    });
  });
});
