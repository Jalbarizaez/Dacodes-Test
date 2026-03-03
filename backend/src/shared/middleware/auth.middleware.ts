import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole, HttpStatus } from '../types/index.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 * TODO: Implement JWT validation when auth module is ready
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(
        res,
        'UNAUTHORIZED',
        'Authentication token is required',
        HttpStatus.UNAUTHORIZED
      );
      return;
    }

    // TODO: Verify JWT token and extract user info
    // For now, this is a placeholder
    // const token = authHeader.substring(7);
    // const decoded = verifyToken(token);
    // req.user = decoded;

    next();
  } catch (error) {
    sendError(
      res,
      'UNAUTHORIZED',
      'Invalid or expired token',
      HttpStatus.UNAUTHORIZED
    );
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(
        res,
        'UNAUTHORIZED',
        'Authentication required',
        HttpStatus.UNAUTHORIZED
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN
      );
      return;
    }

    next();
  };
};
