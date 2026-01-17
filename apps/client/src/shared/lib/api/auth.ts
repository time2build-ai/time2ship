import { apiRequest } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
  };
}

export interface RegisterResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
  };
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: (data: { email: string; password: string }) =>
    apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Register a new user
   */
  register: (data: { email: string; password: string }) =>
    apiRequest<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Refresh access token using refresh token
   */
  refresh: (refreshToken: string) =>
    apiRequest<AuthTokens>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  /**
   * Logout and revoke refresh token
   */
  logout: (refreshToken: string) =>
    apiRequest<void>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
