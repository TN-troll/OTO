import type { Request, Response, NextFunction } from 'express';
import type { ValidationError } from '@car-ads/shared';

/**
 * Error codes used in structured error responses.
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured error response format returned by the API.
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

/**
 * Custom application error with HTTP status and error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly details?: ValidationError[];

  constructor(statusCode: number, code: ErrorCodeType, message: string, details?: ValidationError[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Create a 400 validation error.
 */
export function validationError(message: string, details?: ValidationError[]): AppError {
  return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
}

/**
 * Create a 404 not found error.
 */
export function notFoundError(message: string): AppError {
  return new AppError(404, ErrorCode.NOT_FOUND, message);
}

/**
 * Create a 408 timeout error.
 */
export function timeoutError(message: string): AppError {
  return new AppError(408, ErrorCode.TIMEOUT, message);
}

/**
 * Create a 503 service unavailable error.
 */
export function serviceUnavailableError(message: string): AppError {
  return new AppError(503, ErrorCode.SERVICE_UNAVAILABLE, message);
}

/**
 * Global error handling middleware.
 * Catches errors thrown by route handlers and returns structured JSON responses.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && err.details.length > 0 ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle database connection errors as 503
  if (isDbConnectionError(err)) {
    const response: ErrorResponse = {
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable. Please try again later.',
      },
    };
    res.status(503).json(response);
    return;
  }

  // Fallback for unexpected errors
  const response: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message || 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
}

/**
 * Detect database/service connection errors.
 */
function isDbConnectionError(err: Error): boolean {
  const message = err.message.toLowerCase();
  return (
    message.includes('econnrefused') ||
    message.includes('connection terminated') ||
    message.includes('connection timeout') ||
    message.includes('too many clients') ||
    err.name === 'ConnectionError'
  );
}
