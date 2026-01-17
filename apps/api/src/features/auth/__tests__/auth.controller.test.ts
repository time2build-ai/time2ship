import { Request, Response } from 'express';
import { authController } from '../controllers/auth.controller';
import { authService } from '../services/auth.service';
import { ResponseHelper } from '@/common/helpers/response';

jest.mock('../services/auth.service');
jest.mock('@/common/helpers/response');

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      validated: { body: {} }
    };
    mockRes = {};
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return created response', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };
      mockReq.validated = {
        body: { email: 'test@example.com', password: 'Password123!' }
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(authService.register).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(ResponseHelper.created).toHaveBeenCalledWith(mockRes, mockResult, 'User registered successfully');
    });
  });

  describe('login', () => {
    it('should call authService.login and return success response', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };
      mockReq.validated = {
        body: { email: 'test@example.com', password: 'Password123!' }
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return success response', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      mockReq.validated = {
        body: { refreshToken: 'old-refresh-token' }
      };

      (authService.refresh as jest.Mock).mockResolvedValue(mockResult);

      await authController.refresh(mockReq as Request, mockRes as Response);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockResult);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success response with message', async () => {
      mockReq.validated = {
        body: { refreshToken: 'refresh-token' }
      };

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(authService.logout).toHaveBeenCalledWith('refresh-token');
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, null, 'Logged out successfully');
    });
  });
});
