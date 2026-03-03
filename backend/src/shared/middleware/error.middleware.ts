import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../config/logger.js';
import { sendError } from '../utils/response.js';
import { HttpStatus } from '../types/index.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Invalid input data',
      HttpStatus.BAD_REQUEST,
      err.errors
    );
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode, err.details);
  }

  // Handle unknown errors
  return sendError(
    res,
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR
  );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(
    res,
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`,
    HttpStatus.NOT_FOUND
  );
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
