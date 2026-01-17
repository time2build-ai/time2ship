import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default status code 500', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Custom error', 503);

      expect(error.statusCode).toBe(503);
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should inherit from AppError', () => {
      const error = new NotFoundError('Product');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error with default message', () => {
      const error = new UnauthorizedError('Unauthorized', 'AUTH.UNAUTHORIZED');

      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should create 401 error with custom message', () => {
      const error = new UnauthorizedError('Invalid token', 'AUTH.INVALID_TOKEN');

      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
    });

    it('should inherit from AppError', () => {
      const error = new UnauthorizedError('Unauthorized', 'AUTH.UNAUTHORIZED');

      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Email already exists', 'AUTH.EMAIL_ALREADY_EXISTS');

      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
    });

    it('should inherit from AppError', () => {
      const error = new ConflictError('Duplicate entry', 'CONFLICT.DUPLICATE_ENTRY');

      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should inherit from AppError', () => {
      const error = new ValidationError('Validation failed');

      expect(error).toBeInstanceOf(AppError);
    });
  });
});
