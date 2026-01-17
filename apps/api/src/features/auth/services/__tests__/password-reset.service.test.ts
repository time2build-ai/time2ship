import { PasswordResetService } from '../password-reset.service';
import jwt from 'jsonwebtoken';

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
});
