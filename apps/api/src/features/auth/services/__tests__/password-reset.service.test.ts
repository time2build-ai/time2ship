import { PasswordResetService } from '../password-reset.service';
import { db } from '@/config/database';
import { userService } from '@/features/users/services/user.service';
import { emailService } from '@/common/services/email.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PasswordResetRateLimitError } from '../../errors/password-reset.errors';

jest.mock('@/config/database');
jest.mock('@/features/users/services/user.service');
jest.mock('@/common/services/email.service');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PasswordResetService();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit numeric OTP', () => {
      const otp = (service as any).generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it('should generate different OTPs on subsequent calls', () => {
      const otp1 = (service as any).generateOTP();
      const otp2 = (service as any).generateOTP();
      // Note: there's a tiny chance they're the same, but very unlikely
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a valid JWT with email and type', () => {
      const mockToken = 'mock.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = (service as any).generateResetToken('test@example.com');

      expect(jwt.sign).toHaveBeenCalledWith(
        { email: 'test@example.com', type: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      expect(token).toBe(mockToken);
    });
  });

  describe('checkRateLimit', () => {
    it('should not throw error when under rate limit', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{}, {}]), // 2 requests
        }),
      });

      await expect(
        (service as any).checkRateLimit('test@example.com')
      ).resolves.not.toThrow();
    });

    it('should throw PasswordResetRateLimitError when rate limit exceeded', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{}, {}, {}]), // 3 requests
        }),
      });

      await expect(
        (service as any).checkRateLimit('test@example.com')
      ).rejects.toThrow(PasswordResetRateLimitError);
    });
  });

  describe('cleanupOldRecords', () => {
    it('should delete expired and used records for email', async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      (db.delete as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      await (service as any).cleanupOldRecords('test@example.com');

      expect(db.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    it('should send OTP email when user exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // No recent requests
        }),
      });
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_otp');
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });
      (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await service.requestPasswordReset('test@example.com');

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          email: 'test@example.com',
          resetToken: expect.stringMatching(/^\d{6}$/), // OTP is passed as resetToken
        })
      );
    });

    it('should not send email when user does not exist (silent success)', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (userService.findByEmail as jest.Mock).mockRejectedValue(new Error('User not found'));

      await service.requestPasswordReset('nonexistent@example.com');

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should throw PasswordResetRateLimitError when rate limited', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{}, {}, {}]), // 3 requests
        }),
      });

      await expect(
        service.requestPasswordReset('test@example.com')
      ).rejects.toThrow(PasswordResetRateLimitError);
    });
  });
});
