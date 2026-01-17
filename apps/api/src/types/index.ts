import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  stack?: string;
}

export type AsyncRequestHandler = (
  req: Request,
  res: Response
) => Promise<void | Response>;
