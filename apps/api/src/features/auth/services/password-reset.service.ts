import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@/config/database';
import { passwordResets } from '../schemas/password-reset.schema';
import { userService } from '@/features/users/services/user.service';
import { emailService } from '@/common/services/email.service';
import { eq, and, gt, sql } from 'drizzle-orm';
import {
  PasswordResetRateLimitError,
  InvalidOtpError,
  InvalidResetTokenError,
} from '../errors/password-reset.errors';

const SALT_ROUNDS = 10;
const OTP_EXPIRATION_MINUTES = 15;
const RESET_TOKEN_EXPIRATION_MINUTES = 10;
const RATE_LIMIT_REQUESTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

/**
 * Service handling password reset operations.
 * Manages OTP generation, verification, and password updates.
 */
export class PasswordResetService {
  /**
   * Generates a 6-digit numeric OTP
   * @private
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generates a short-lived JWT reset token
   * @private
   */
  private generateResetToken(email: string): string {
    return jwt.sign(
      { email, type: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: `${RESET_TOKEN_EXPIRATION_MINUTES}m` }
    );
  }

  /**
   * Checks if the email has exceeded the rate limit for password reset requests
   * @private
   */
  private async checkRateLimit(email: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

    const recentRequests = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.email, email),
          gt(passwordResets.createdAt, oneHourAgo)
        )
      );

    if (recentRequests.length >= RATE_LIMIT_REQUESTS) {
      throw new PasswordResetRateLimitError();
    }
  }

  /**
   * Deletes expired or used password reset records for the given email
   * @private
   */
  private async cleanupOldRecords(email: string): Promise<void> {
    await db
      .delete(passwordResets)
      .where(
        and(
          eq(passwordResets.email, email),
          sql`(${passwordResets.expiresAt} < NOW() OR ${passwordResets.used} = true)`
        )
      );
  }

  /**
   * Initiates a password reset request by generating and sending an OTP
   * @param email - User's email address
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Check rate limiting
    await this.checkRateLimit(email);

    // Cleanup old records
    await this.cleanupOldRecords(email);

    // Check if user exists (catch error to prevent enumeration)
    let userExists = true;
    try {
      await userService.findByEmail(email);
    } catch (error) {
      userExists = false;
    }

    // Only proceed if user exists, but always return success
    if (userExists) {
      const otp = this.generateOTP();
      const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

      // Store hashed OTP in database
      await db.insert(passwordResets).values({
        email,
        otp: hashedOtp,
        expiresAt,
      });

      // Send email with plain OTP (passed as resetToken to reuse template)
      await emailService.sendPasswordResetEmail(email, {
        email,
        resetToken: otp, // OTP code sent in email
      });
    }

    // Always return success to prevent email enumeration
  }

  /**
   * Verifies an OTP and generates a reset token
   * @param email - User's email address
   * @param otp - 6-digit OTP code
   * @returns Reset token (JWT)
   */
  async verifyOTP(email: string, otp: string): Promise<string> {
    // Look up non-expired, unused OTP record
    const records = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.email, email),
          gt(passwordResets.expiresAt, sql`NOW()`),
          eq(passwordResets.used, false)
        )
      );

    if (records.length === 0) {
      throw new InvalidOtpError();
    }

    const record = records[0];

    // Verify OTP
    const isValid = await bcrypt.compare(otp, record.otp);
    if (!isValid) {
      throw new InvalidOtpError();
    }

    // Generate reset token
    const resetToken = this.generateResetToken(email);

    // Mark OTP as used and store reset token
    await db
      .update(passwordResets)
      .set({
        used: true,
        resetToken,
      })
      .where(eq(passwordResets.id, record.id));

    return resetToken;
  }

  /**
   * Resets user password using a valid reset token
   * @param resetToken - JWT reset token from OTP verification
   * @param newPassword - New password (plain text, will be hashed)
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    // Verify JWT
    let payload: { email: string; type: string };
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET!) as { email: string; type: string };
    } catch (error) {
      throw new InvalidResetTokenError();
    }

    // Look up reset record by token
    const records = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.email, payload.email),
          eq(passwordResets.resetToken, resetToken),
          eq(passwordResets.used, false)
        )
      );

    if (records.length === 0) {
      throw new InvalidResetTokenError();
    }

    const record = records[0];

    // Find user
    const user = await userService.findByEmail(payload.email);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password
    await userService.updatePassword(user.id, hashedPassword);

    // Mark reset record as used
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, record.id));
  }
}

export const passwordResetService = new PasswordResetService();
