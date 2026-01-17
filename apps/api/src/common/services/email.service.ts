import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '@/config/env';
import logger from '@/common/utils/logger';

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
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Time2Ship</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to Time2Ship! 🚀</h1>

            <p style="font-size: 16px; margin-bottom: 15px;">
              Hi there,
            </p>

            <p style="font-size: 16px; margin-bottom: 15px;">
              Thank you for registering with Time2Ship! Your account has been successfully created.
            </p>

            <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #666;">
                <strong>Email:</strong> ${data.email}
              </p>
            </div>

            <p style="font-size: 16px; margin-bottom: 15px;">
              You can now start using all the features of Time2Ship.
            </p>

            <p style="font-size: 16px; margin-bottom: 15px;">
              If you have any questions, feel free to reach out to our support team.
            </p>

            <p style="font-size: 16px; margin-top: 30px;">
              Best regards,<br>
              The Time2Ship Team
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Returns the HTML template for password reset emails.
   */
  private getPasswordResetTemplate(data: { resetToken: string; email: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h1>

            <p style="font-size: 16px; margin-bottom: 15px;">
              Hi,
            </p>

            <p style="font-size: 16px; margin-bottom: 15px;">
              We received a request to reset the password for your Time2Ship account (${data.email}).
            </p>

            <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;">
                <strong>Your reset token:</strong>
              </p>
              <p style="margin: 0; font-family: monospace; font-size: 14px; background-color: #f8f9fa; padding: 10px; border-radius: 3px; word-break: break-all;">
                ${data.resetToken}
              </p>
            </div>

            <p style="font-size: 16px; margin-bottom: 15px;">
              If you didn't request this password reset, please ignore this email.
            </p>

            <p style="font-size: 16px; margin-top: 30px;">
              Best regards,<br>
              The Time2Ship Team
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
