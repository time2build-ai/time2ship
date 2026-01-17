import { Request, Response } from 'express';
import { notFoundHandler } from '../notFoundHandler';

describe('notFoundHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      originalUrl: '/api/nonexistent',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 404 status with error message', () => {
    notFoundHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Route not found',
      path: '/api/nonexistent',
    });
  });

  it('should include the requested path in response', () => {
    mockReq.originalUrl = '/api/some/path';

    notFoundHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/some/path',
      })
    );
  });
});
