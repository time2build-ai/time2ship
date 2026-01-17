import bcrypt from 'bcrypt';
import { userService } from '@/features/users/services/user.service';
import { tokenService } from './token.service';
import { InvalidCredentialsError, RefreshTokenInvalidError } from '../errors/auth.errors';

/**
 * Service handling user authentication operations.
 * Manages registration, login, token refresh, and logout functionality.
 */
export class AuthService {
  /**
   * Registers a new user with email and password.
   *
   * @param email - User's email address
   * @param password - Plain text password (will be hashed)
   * @returns User object with access and refresh tokens
   * @throws {AppError} If email is already registered
   */
  async register(email: string, password: string) {
    const user = await userService.create(email, password);

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await tokenService.storeRefreshToken(refreshToken, user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param email - User's email address
   * @param password - Plain text password to verify
   * @returns User object (without password) with access and refresh tokens
   * @throws {InvalidCredentialsError} If credentials are invalid
   */
  async login(email: string, password: string) {
    // Catch user not found error and convert to InvalidCredentialsError
    // to avoid user enumeration
    let user;
    try {
      user = await userService.findByEmail(email);
    } catch (error) {
      throw new InvalidCredentialsError();
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await tokenService.storeRefreshToken(refreshToken, user.id);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotates tokens using a valid refresh token.
   * Revokes the old refresh token and issues new access and refresh tokens.
   *
   * @param oldRefreshToken - The current refresh token
   * @returns New access and refresh tokens
   * @throws {RefreshTokenInvalidError} If refresh token is invalid, expired, or revoked
   */
  async refresh(oldRefreshToken: string) {
    let userId;
    try {
      userId = await tokenService.verifyRefreshToken(oldRefreshToken);
    } catch (error) {
      throw new RefreshTokenInvalidError();
    }

    const user = await userService.findById(userId);

    await tokenService.revokeRefreshToken(oldRefreshToken);

    const accessToken = tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await tokenService.storeRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logs out a user by revoking their refresh token.
   *
   * @param refreshToken - The refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }
}

export const authService = new AuthService();
