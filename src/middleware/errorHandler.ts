import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ErrorResponse } from '../types';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.message) {
    message = err.message;
    // Set appropriate status codes for common errors
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('invalid') || message.includes('Invalid')) {
      statusCode = 400;
    } else if (message.includes('already exists')) {
      statusCode = 409;
    } else if (message.includes('not enabled')) {
      statusCode = 403;
    }
  }

  // Send error response
  const errorResponse: ErrorResponse = {
    error: message,
    statusCode,
    ...(details && { details }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', { path: req.path, method: req.method });

  const errorResponse: ErrorResponse = {
    error: 'Route not found',
    statusCode: 404,
  };

  res.status(404).json(errorResponse);
}
