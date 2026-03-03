import { Response } from 'express';
import { ApiResponse, ApiError, HttpStatus, PaginationMeta } from '../types/index.js';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: HttpStatus = HttpStatus.OK,
  meta?: PaginationMeta
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  details?: any
): Response => {
  const response: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  total: number,
  page: number,
  pageSize: number
): PaginationMeta => {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
};
