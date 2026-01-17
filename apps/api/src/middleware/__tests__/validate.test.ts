import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate';
import { AppError } from '@/common/utils/errors';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should attach validated data to request', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    mockRequest.body = { email: 'test@example.com' };

    const middleware = validate(schema);
    middleware(mockRequest as any, mockResponse as Response, nextFunction);

    expect((mockRequest as any).validated).toBeDefined();
    expect((mockRequest as any).validated.body.email).toBe('test@example.com');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next with error for invalid data', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    mockRequest.body = { email: 'invalid-email' };

    const middleware = validate(schema);
    middleware(mockRequest as any, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });
});
