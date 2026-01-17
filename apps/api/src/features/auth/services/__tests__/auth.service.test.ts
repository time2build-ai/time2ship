import { AuthService } from '../auth.service';
import { userService } from '@/features/users/services/user.service';
import { tokenService } from '../token.service';
import { AppError } from '@/common/utils/errors';
import bcrypt from 'bcrypt';

jest.mock('@/features/users/services/user.service');
jest.mock('../token.service');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register new user and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.create as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (tokenService.generateAccessToken as jest.Mock) = jest.fn().mockReturnValue('access_token');
      (tokenService.generateRefreshToken as jest.Mock) = jest.fn().mockReturnValue('refresh_token');
      (tokenService.storeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await authService.register('test@example.com', 'Password123!');

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(tokenService.storeRefreshToken).toHaveBeenCalledWith('refresh_token', 'user-123');
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.findByEmail as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);
      (tokenService.generateAccessToken as jest.Mock) = jest.fn().mockReturnValue('access_token');
      (tokenService.generateRefreshToken as jest.Mock) = jest.fn().mockReturnValue('refresh_token');
      (tokenService.storeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'Password123!');

      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.findByEmail as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'WrongPassword123!')
      ).rejects.toThrow(AppError);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tokenService.verifyRefreshToken as jest.Mock) = jest.fn().mockResolvedValue('user-123');
      (userService.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (tokenService.revokeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      (tokenService.generateAccessToken as jest.Mock) = jest.fn().mockReturnValue('new_access_token');
      (tokenService.generateRefreshToken as jest.Mock) = jest.fn().mockReturnValue('new_refresh_token');
      (tokenService.storeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await authService.refresh('old_refresh_token');

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('old_refresh_token');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      (tokenService.revokeRefreshToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await authService.logout('refresh_token');

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh_token');
    });
  });
});
