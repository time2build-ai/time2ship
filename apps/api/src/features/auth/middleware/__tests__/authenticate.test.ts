import { Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../authenticate';
import { tokenService } from '../../services/token.service';
import { AppError } from '@/common/utils/errors';

jest.mock('../../services/token.service');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should attach user to request for valid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer valid_token',
    };

    (tokenService.verifyAccessToken as jest.Mock) = jest.fn().mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next with error when no authorization header', () => {
    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next with error for malformed authorization header', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat',
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next with error for invalid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid_token',
    };

    (tokenService.verifyAccessToken as jest.Mock) = jest.fn().mockImplementation(() => {
      throw new AppError('Invalid token', 401);
    });

    authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });
});
