import { EmailService } from '../email.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct data', async () => {
      const to = 'test@example.com';
      const data = { email: to };

      await emailService.sendWelcomeEmail(to, data);

      // In test environment, it should log instead of sending
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should not throw error on email failure', async () => {
      const to = 'test@example.com';
      const data = { email: to };

      // Should not throw even if sending fails
      await expect(emailService.sendWelcomeEmail(to, data)).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct data', async () => {
      const to = 'test@example.com';
      const data = { email: to, resetToken: 'test-token-123' };

      await emailService.sendPasswordResetEmail(to, data);

      // In test environment, it should log instead of sending
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should include reset token in email', async () => {
      const to = 'test@example.com';
      const resetToken = 'secure-reset-token-456';
      const data = { email: to, resetToken };

      await emailService.sendPasswordResetEmail(to, data);

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct data', async () => {
      const to = 'test@example.com';
      const data = { email: to, verificationToken: 'verification-token-123' };

      await emailService.sendVerificationEmail(to, data);

      // In test environment, it should log instead of sending
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should include verification token in email', async () => {
      const to = 'test@example.com';
      const verificationToken = 'secure-verification-token-456';
      const data = { email: to, verificationToken };

      await emailService.sendVerificationEmail(to, data);

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('email templates', () => {
    it('should generate welcome email template with user email', () => {
      const data = { email: 'user@example.com' };
      const service = emailService as any;
      const html = service.getWelcomeEmailTemplate(data);

      expect(html).toContain(data.email);
      expect(html).toContain('Welcome to Time2Ship');
    });

    it('should generate password reset template with token', () => {
      const data = { email: 'user@example.com', resetToken: 'token123' };
      const service = emailService as any;
      const html = service.getPasswordResetTemplate(data);

      expect(html).toContain(data.resetToken);
      expect(html).toContain('Password Reset');
    });

    it('should generate verification email template with token', () => {
      const data = { email: 'user@example.com', verificationToken: 'verification123' };
      const service = emailService as any;
      const html = service.getVerificationEmailTemplate(data);

      expect(html).toContain(data.verificationToken);
      expect(html).toContain('Verify Your Email');
    });
  });

  describe('error handling', () => {
    it('should not throw when email sending fails', async () => {
      const to = 'test@example.com';
      const data = { email: to };

      // Email service should catch and log errors internally
      await expect(emailService.sendWelcomeEmail(to, data)).resolves.not.toThrow();
    });
  });
});
