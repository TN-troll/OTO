import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { validateFilterCriteria, validateSearchQuery } from './validation.js';
import { AppError } from './error-handler.js';

function createMockReq(body?: unknown, query?: Record<string, unknown>): Request {
  return {
    body: body === null ? null : (body ?? {}),
    query: query ?? {},
  } as unknown as Request;
}

function createMockRes(): Response {
  return {} as Response;
}

describe('validateFilterCriteria middleware', () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createMockRes();
    next = vi.fn();
  });

  it('calls next() for valid empty filter criteria', () => {
    const req = createMockReq({});
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() for valid filter criteria with ranges', () => {
    const req = createMockReq({
      horsepowerMin: 100,
      horsepowerMax: 500,
      priceMin: 10000,
      priceMax: 200000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns error when engine displacement min > max', () => {
    const req = createMockReq({
      engineDisplacementMin: 5000,
      engineDisplacementMax: 2000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.details).toContainEqual({
      field: 'engineDisplacement',
      message: 'Minimum engine displacement must not exceed maximum',
    });
  });

  it('returns error when horsepower min > max', () => {
    const req = createMockReq({
      horsepowerMin: 800,
      horsepowerMax: 300,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'horsepower',
      message: 'Minimum horsepower must not exceed maximum',
    });
  });

  it('returns error when year min > max', () => {
    const req = createMockReq({
      yearMin: 2024,
      yearMax: 2000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'year',
      message: 'Minimum year must not exceed maximum',
    });
  });

  it('returns error when price min > max', () => {
    const req = createMockReq({
      priceMin: 100000,
      priceMax: 50000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'price',
      message: 'Minimum price must not exceed maximum',
    });
  });

  it('returns multiple errors for multiple invalid ranges', () => {
    const req = createMockReq({
      horsepowerMin: 800,
      horsepowerMax: 300,
      priceMin: 100000,
      priceMax: 50000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toHaveLength(2);
  });

  it('returns error for out-of-bound displacement', () => {
    const req = createMockReq({
      engineDisplacementMax: 15000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'engineDisplacementMax',
      message: 'Engine displacement maximum must not exceed 10000',
    });
  });

  it('returns error for negative displacement', () => {
    const req = createMockReq({
      engineDisplacementMin: -100,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'engineDisplacementMin',
      message: 'Engine displacement minimum must be at least 0',
    });
  });

  it('returns error for out-of-bound horsepower', () => {
    const req = createMockReq({
      horsepowerMax: 3000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'horsepowerMax',
      message: 'Horsepower maximum must not exceed 2000',
    });
  });

  it('returns error for year below minimum', () => {
    const req = createMockReq({
      yearMin: 1900,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'yearMin',
      message: 'Year minimum must be at least 1950',
    });
  });

  it('returns error for price exceeding maximum', () => {
    const req = createMockReq({
      priceMax: 60000000,
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'priceMax',
      message: 'Price maximum must not exceed 50000000',
    });
  });

  it('validates search query in filter criteria - too short', () => {
    const req = createMockReq({
      searchQuery: 'a',
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'searchQuery',
      message: 'Search query must be at least 2 characters',
    });
  });

  it('validates search query in filter criteria - too long', () => {
    const req = createMockReq({
      searchQuery: 'x'.repeat(101),
    });
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.details).toContainEqual({
      field: 'searchQuery',
      message: 'Search query must not exceed 100 characters',
    });
  });

  it('rejects null body', () => {
    const req = createMockReq(null);
    validateFilterCriteria(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });
});

describe('validateSearchQuery middleware', () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createMockRes();
    next = vi.fn();
  });

  it('calls next() for valid search query', () => {
    const req = createMockReq({}, { q: 'Ferrari' });
    validateSearchQuery(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() for minimum length query (2 chars)', () => {
    const req = createMockReq({}, { q: 'BM' });
    validateSearchQuery(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns error when query parameter is missing', () => {
    const req = createMockReq({}, {});
    validateSearchQuery(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.details).toContainEqual({
      field: 'q',
      message: 'Search query parameter "q" is required',
    });
  });

  it('returns error when query is empty string', () => {
    const req = createMockReq({}, { q: '' });
    validateSearchQuery(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('returns error when query exceeds 100 characters', () => {
    const req = createMockReq({}, { q: 'x'.repeat(101) });
    validateSearchQuery(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.details).toContainEqual({
      field: 'q',
      message: 'Search query must not exceed 100 characters',
    });
  });

  it('allows exactly 100 character query', () => {
    const req = createMockReq({}, { q: 'x'.repeat(100) });
    validateSearchQuery(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows short queries through (< 2 chars pass validation, handled by service)', () => {
    const req = createMockReq({}, { q: 'a' });
    validateSearchQuery(req, res, next);
    // Short queries pass the middleware - the search service returns empty results
    expect(next).toHaveBeenCalledWith();
  });
});
