import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { and, eq, gt, lt, or, sql } from 'drizzle-orm';

import { db } from '@/config/database';
import { env } from '@/config/env';
import { emailService } from '@/common/services/email.service';
import { userService } from '@/features/users/services/user.service';

import {
  InvalidOtpError,
  InvalidResetTokenError,
  PasswordResetRateLimitError,
} from '../errors/password-reset.errors';
import { passwordResets } from '../schemas/password-reset.schema';

const SALT_ROUNDS = 10;
const OTP_EXPIRATION_MINUTES = 15;
const RESET_TOKEN_EXPIRATION_MINUTES = 10;
const RATE_LIMIT_REQUESTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

function logDev(message: string): void {
  if (IS_DEVELOPMENT) {
    console.log(`[DEV] ${message}`);
  }
}

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
      env.JWT_ACCESS_SECRET,
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
          or(
            lt(passwordResets.expiresAt, sql`NOW()`),
            eq(passwordResets.used, true)
          )
        )
      );
  }

  /**
   * Initiates a password reset request by generating and sending an OTP
   * @param email - User's email address
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check rate limiting
    await this.checkRateLimit(normalizedEmail);

    // Cleanup old records
    await this.cleanupOldRecords(normalizedEmail);

    // Check if user exists (catch error to prevent enumeration)
    let userExists = true;
    try {
      await userService.findByEmail(normalizedEmail);
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
        email: normalizedEmail,
        otp: hashedOtp,
        expiresAt,
      });

      // Send email with plain OTP (passed as resetToken to reuse template)
      await emailService.sendPasswordResetEmail(normalizedEmail, {
        email: normalizedEmail,
        resetToken: otp, // OTP code sent in email
      });

      logDev(`Password reset OTP for ${normalizedEmail}: ${otp}`);
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
    // Trim and normalize OTP input
    const normalizedOtp = otp.trim();

    // Look up non-expired OTP record that hasn't been verified yet (resetToken is NULL)
    const records = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.email, email.trim().toLowerCase()),
          gt(passwordResets.expiresAt, sql`NOW()`),
          sql`${passwordResets.resetToken} IS NULL`
        )
      )
      .orderBy(sql`${passwordResets.createdAt} DESC`);

    if (records.length === 0) {
      logDev(`No valid OTP record found for ${email}`);
      throw new InvalidOtpError();
    }

    const record = records[0];
    logDev(`Verifying OTP for ${email}, input length: ${normalizedOtp.length}`);

    const isValid = await bcrypt.compare(normalizedOtp, record.otp);
    if (!isValid) {
      logDev(`OTP comparison failed for ${email}`);
      throw new InvalidOtpError();
    }

    // Generate reset token
    const resetToken = this.generateResetToken(email);

    // Store reset token (marks OTP as verified, but not yet used for password reset)
    await db
      .update(passwordResets)
      .set({
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
      payload = jwt.verify(resetToken, env.JWT_ACCESS_SECRET) as { email: string; type: string };
    } catch (error) {
      throw new InvalidResetTokenError();
    }

    // Look up reset record by token that hasn't been used yet
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
