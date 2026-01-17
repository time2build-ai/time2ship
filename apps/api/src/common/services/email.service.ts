import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '@/config/env';
import logger from '@/common/utils/logger';
import {
  createEmailLayout,
  emailHeading,
  emailParagraph,
  emailButton,
  emailInfoBox,
  emailCodeBlock,
  emailSignature,
} from '@/common/templates/email-layout';

/**
 * Email service for sending transactional emails.
 * Handles email transport configuration and email sending operations.
 */
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_PORT, 10),
      secure: env.EMAIL_SECURE === 'true',
      auth: env.EMAIL_USER && env.EMAIL_PASSWORD
        ? {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASSWORD,
          }
        : undefined,
    });
  }

  /**
   * Sends a welcome email to a newly registered user.
   *
   * @param to - Recipient email address
   * @param data - Additional data for the email template
   */
  async sendWelcomeEmail(to: string, data: { email: string }): Promise<void> {
    const subject = 'Welcome to Time2Ship!';
    const html = this.getWelcomeEmailTemplate(data);

    await this.sendEmail(to, subject, html);
  }

  /**
   * Sends a password reset email.
   *
   * @param to - Recipient email address
   * @param data - Reset token and user information
   */
  async sendPasswordResetEmail(to: string, data: { resetToken: string; email: string }): Promise<void> {
    const subject = 'Password Reset Request';
    const html = this.getPasswordResetTemplate(data);

    await this.sendEmail(to, subject, html);
  }

  /**
   * Sends an email verification email.
   *
   * @param to - Recipient email address
   * @param data - Verification token and user information
   */
  async sendVerificationEmail(to: string, data: { verificationToken: string; email: string }): Promise<void> {
    const subject = 'Verify Your Email Address';
    const html = this.getVerificationEmailTemplate(data);

    await this.sendEmail(to, subject, html);
  }

  /**
   * Generic email sending method.
   *
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param html - Email HTML content
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      // In test environment, log instead of sending
      if (env.NODE_ENV === 'test') {
        logger.info('Email would be sent in production', { to, subject });
        return;
      }

      // In development without credentials, log the email
      if (env.NODE_ENV === 'development' && (!env.EMAIL_USER || !env.EMAIL_PASSWORD)) {
        logger.info('Email preview (configure EMAIL_USER and EMAIL_PASSWORD to send):', {
          to,
          subject,
          preview: html.substring(0, 100),
        });
        return;
      }

      const info = await this.transporter.sendMail({
        from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      });

      logger.info('Email sent successfully', { messageId: info.messageId, to });
    } catch (error) {
      logger.error('Failed to send email', { error, to, subject });
      // Don't throw - email failures shouldn't block user registration
      // In production, you might want to queue failed emails for retry
    }
  }

  /**
   * Returns the HTML template for welcome emails.
   */
  private getWelcomeEmailTemplate(data: { email: string }): string {
    const content = `
      ${emailHeading('Welcome to Time2Ship! 🚀')}

      ${emailParagraph('Hi there,')}

      ${emailParagraph('Thank you for registering with Time2Ship! Your account has been successfully created and you\'re ready to start building amazing things.')}

      ${emailInfoBox(`
        <strong>Your Account:</strong><br />
        Email: ${data.email}
      `)}

      ${emailParagraph('Here\'s what you can do next:')}

      ${emailParagraph(`
        <strong>✓</strong> Complete your profile<br />
        <strong>✓</strong> Explore our features<br />
        <strong>✓</strong> Start your first project<br />
        <strong>✓</strong> Invite your team members
      `)}

      ${emailButton('Get Started', `${env.CLIENT_URL || 'http://localhost:3000'}/dashboard`)}

      ${emailParagraph('If you have any questions or need assistance, our support team is here to help. Just reply to this email and we\'ll get back to you as soon as possible.')}

      ${emailSignature()}
    `;

    return createEmailLayout({
      title: 'Welcome to Time2Ship',
      preheader: 'Your account has been successfully created',
      content,
    });
  }

  /**
   * Returns the HTML template for password reset emails.
   */
  private getPasswordResetTemplate(data: { resetToken: string; email: string }): string {
    const resetUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`;

    const content = `
      ${emailHeading('Password Reset Request 🔐')}

      ${emailParagraph('Hi,')}

      ${emailParagraph(`We received a request to reset the password for your Time2Ship account (<strong>${data.email}</strong>).`)}

      ${emailParagraph('Click the button below to reset your password. This link will expire in 1 hour for security reasons.')}

      ${emailButton('Reset Password', resetUrl, { color: '#ef4444' })}

      ${emailParagraph('Or copy and paste this link into your browser:')}

      ${emailCodeBlock(resetUrl)}

      ${emailInfoBox(`
        <strong>⚠️ Security Notice:</strong><br />
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      `, { backgroundColor: '#fef2f2' })}

      ${emailParagraph('For security reasons, this reset link will expire in 1 hour. If you need a new link, you can request another password reset.')}

      ${emailSignature()}
    `;

    return createEmailLayout({
      title: 'Password Reset Request',
      preheader: 'Reset your Time2Ship password',
      content,
    });
  }

  /**
   * Returns the HTML template for email verification emails.
   */
  private getVerificationEmailTemplate(data: { verificationToken: string; email: string }): string {
    const verificationUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${data.verificationToken}`;

    const content = `
      ${emailHeading('Verify Your Email Address ✉️')}

      ${emailParagraph('Hi,')}

      ${emailParagraph(`Thanks for signing up with Time2Ship! To complete your registration, please verify your email address (<strong>${data.email}</strong>).`)}

      ${emailParagraph('Click the button below to verify your email and activate your account:')}

      ${emailButton('Verify Email Address', verificationUrl, { color: '#10b981' })}

      ${emailParagraph('Or copy and paste this link into your browser:')}

      ${emailCodeBlock(verificationUrl)}

      ${emailInfoBox(`
        <strong>Why verify?</strong><br />
        Email verification helps us ensure the security of your account and allows us to send you important updates about your Time2Ship account.
      `)}

      ${emailParagraph('This verification link will expire in 24 hours. If it expires, you can request a new verification email from your account settings.')}

      ${emailParagraph('If you didn\'t create an account with Time2Ship, you can safely ignore this email.')}

      ${emailSignature()}
    `;

    return createEmailLayout({
      title: 'Verify Your Email',
      preheader: 'Please verify your email address to complete registration',
      content,
    });
  }
}

export const emailService = new EmailService();
