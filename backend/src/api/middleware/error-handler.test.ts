import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  AppError,
  ErrorCode,
  validationError,
  notFoundError,
  timeoutError,
  serviceUnavailableError,
} from './error-handler.js';

function createMockRes(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response;
}

function createMockReq(): Request {
  return {} as Request;
}

const mockNext: NextFunction = vi.fn();

describe('errorHandler middleware', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    vi.clearAllMocks();
  });

  it('returns structured 400 response for validation errors', () => {
    const err = validationError('Invalid filter criteria', [
      { field: 'price', message: 'Minimum price must not exceed maximum' },
    ]);

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid filter criteria',
        details: [{ field: 'price', message: 'Minimum price must not exceed maximum' }],
      },
    });
  });

  it('returns structured 404 response for not found errors', () => {
    const err = notFoundError('Listing not found');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Listing not found',
      },
    });
  });

  it('returns structured 408 response for timeout errors', () => {
    const err = timeoutError('Request timed out');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(408);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'TIMEOUT',
        message: 'Request timed out',
      },
    });
  });

  it('returns structured 503 response for service unavailable errors', () => {
    const err = serviceUnavailableError('Database is down');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is down',
      },
    });
  });

  it('returns 503 for database connection errors', () => {
    const err = new Error('connect ECONNREFUSED 127.0.0.1:5432');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again later.',
      },
    });
  });

  it('returns 503 for connection terminated errors', () => {
    const err = new Error('Connection terminated unexpectedly');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again later.',
      },
    });
  });

  it('returns 500 for unknown errors in non-production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('Something unexpected happened');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something unexpected happened',
      },
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('returns generic message for unknown errors in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new Error('Sensitive internal details');

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('omits details field when empty array is provided', () => {
    const err = new AppError(400, ErrorCode.VALIDATION_ERROR, 'Bad request', []);

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Bad request',
      },
    });
  });

  it('includes multiple validation details', () => {
    const err = validationError('Multiple errors', [
      { field: 'price', message: 'Min exceeds max' },
      { field: 'year', message: 'Min exceeds max' },
    ]);

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(response.error.details).toHaveLength(2);
    expect(response.error.details[0].field).toBe('price');
    expect(response.error.details[1].field).toBe('year');
  });
});

describe('AppError', () => {
  it('has correct properties', () => {
    const err = new AppError(422, ErrorCode.VALIDATION_ERROR, 'test message', [
      { field: 'test', message: 'error' },
    ]);

    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('test message');
    expect(err.details).toEqual([{ field: 'test', message: 'error' }]);
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });
});
