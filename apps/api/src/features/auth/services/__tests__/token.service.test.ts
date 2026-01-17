import { TokenService } from '../token.service';
import { db } from '@/config/database';
import { AppError } from '@/common/utils/errors';
import jwt from 'jsonwebtoken';

jest.mock('@/config/database');
jest.mock('jsonwebtoken');

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
    tokenService = new TokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      (jwt.sign as jest.Mock) = jest.fn().mockReturnValue('access_token');

      const token = tokenService.generateAccessToken('user-123', 'test@example.com');

      expect(token).toBe('access_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', email: 'test@example.com' },
        'test-access-secret-32-characters-long',
        { expiresIn: '15m' }
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      (jwt.sign as jest.Mock) = jest.fn().mockReturnValue('refresh_token');

      const token = tokenService.generateRefreshToken('user-123');

      expect(token).toBe('refresh_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'test-refresh-secret-32-characters-long',
        { expiresIn: '7d' }
      );
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token in database', async () => {
      (db.insert as jest.Mock) = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await tokenService.storeRefreshToken('token-123', 'user-123');

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockToken = {
        token: 'valid-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 1000000),
        isRevoked: false,
      };

      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ userId: 'user-123' });
      (db.query.refreshTokens.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockToken);

      const userId = await tokenService.verifyRefreshToken('valid-token');

      expect(userId).toBe('user-123');
    });

    it('should throw error for invalid JWT', async () => {
      (jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(tokenService.verifyRefreshToken('invalid-token')).rejects.toThrow(
        AppError
      );
    });

    it('should throw error for revoked token', async () => {
      const mockToken = {
        token: 'revoked-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 1000000),
        isRevoked: true,
      };

      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ userId: 'user-123' });
      (db.query.refreshTokens.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockToken);

      await expect(tokenService.verifyRefreshToken('revoked-token')).rejects.toThrow(
        AppError
      );
    });

    it('should throw error for expired token', async () => {
      const mockToken = {
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000000),
        isRevoked: false,
      };

      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ userId: 'user-123' });
      (db.query.refreshTokens.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockToken);

      await expect(tokenService.verifyRefreshToken('expired-token')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token', async () => {
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await tokenService.revokeRefreshToken('token-123');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      (jwt.verify as jest.Mock) = jest
        .fn()
        .mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      const result = tokenService.verifyAccessToken('valid-token');

      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error for invalid access token', () => {
      (jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.verifyAccessToken('invalid-token')).toThrow(AppError);
    });
  });
});
