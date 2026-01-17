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
});
