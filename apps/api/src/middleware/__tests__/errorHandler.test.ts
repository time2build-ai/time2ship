import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('should handle AppError with correct status code', () => {
    const error = new AppError('Test error', 400, 'TEST.ERROR');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'TEST.ERROR',
          message: 'Test error',
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      })
    );
  });

  it('should handle generic Error in development with error message', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Generic error');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'SERVER.INTERNAL_ERROR',
          message: 'Generic error',
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      })
    );
    expect(console.error).toHaveBeenCalledWith('Unexpected error:', error);
  });

  it('should handle generic Error in production with generic message', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Sensitive internal error');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'SERVER.INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      })
    );
    expect(console.error).toHaveBeenCalledWith('Unexpected error:', error);
  });

  it('should log unexpected errors', () => {
    const error = new Error('Unexpected');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(console.error).toHaveBeenCalledWith('Unexpected error:', error);
  });

  it('should not log AppError (operational errors) as unexpected', () => {
    process.env.NODE_ENV = 'production';
    const error = new AppError('User error', 400, 'USER.ERROR');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(console.error).not.toHaveBeenCalledWith('Unexpected error:', error);
  });
});
