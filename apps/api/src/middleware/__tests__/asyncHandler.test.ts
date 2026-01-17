import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../asyncHandler';

describe('asyncHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call next with error when async handler throws', async () => {
    const error = new Error('Test error');
    const handler = asyncHandler(async () => {
      throw error;
    });

    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should not call next when async handler succeeds', async () => {
    const handler = asyncHandler(async (_req: Request, res: Response) => {
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
      res.status(200).json({ success: true });
    });

    mockRes.status = jest.fn().mockReturnThis();
    mockRes.json = jest.fn();

    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle promise rejections', (done) => {
    const error = new Error('Promise rejection');
    const handler = asyncHandler(async () => {
      return Promise.reject(error);
    });

    handler(mockReq as Request, mockRes as Response, mockNext);

    // Wait for the promise to reject and be caught
    setImmediate(() => {
      expect(mockNext).toHaveBeenCalledWith(error);
      done();
    });
  });
});
