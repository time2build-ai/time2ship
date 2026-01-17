import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json(errorResponse);
};
