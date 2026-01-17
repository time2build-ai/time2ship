// apps/api/src/features/users/__tests__/user.controller.test.ts
import { Request, Response } from 'express';
import { userController } from '../controllers/user.controller';
import { userService } from '../services/user.service';
import { ResponseHelper } from '@/common/helpers/response';

jest.mock('../services/user.service');
jest.mock('@/common/helpers/response');

describe('UserController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      validated: { body: {} }
    };
    mockRes = {};
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call userService.findAll and return success response with meta', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'user2@example.com', createdAt: new Date(), updatedAt: new Date() }
      ];
      const mockMeta = { page: 1, limit: 10, total: 2, totalPages: 1 };
      mockReq.query = { page: '1', limit: '10' };

      (userService.findAll as jest.Mock).mockResolvedValue({ users: mockUsers, meta: mockMeta });

      await userController.list(mockReq as Request, mockRes as Response);

      expect(userService.findAll).toHaveBeenCalledWith(mockReq.query);
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockRes, mockUsers, undefined, mockMeta);
    });
  });
});
