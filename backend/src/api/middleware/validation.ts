import type { Request, Response, NextFunction } from 'express';
import type { FilterCriteria, ValidationError } from '@car-ads/shared';
import {
  SEARCH_QUERY_MIN_LENGTH,
  SEARCH_QUERY_MAX_LENGTH,
  DISPLACEMENT_MIN,
  DISPLACEMENT_MAX,
  HORSEPOWER_MIN,
  HORSEPOWER_MAX,
  YEAR_MIN,
  YEAR_MAX,
  PRICE_MIN,
  PRICE_MAX,
} from '@car-ads/shared';
import { validationError } from './error-handler.js';

/**
 * Middleware that validates filter criteria in the request body (POST /api/listings/filter).
 * Returns 400 with structured error messages for invalid ranges or out-of-bound values.
 */
export function validateFilterCriteria(req: Request, _res: Response, next: NextFunction): void {
  const criteria = req.body as FilterCriteria;

  if (criteria === null || criteria === undefined || typeof criteria !== 'object' || Array.isArray(criteria)) {
    next(validationError('Request body must be a valid filter criteria object'));
    return;
  }

  const errors: ValidationError[] = [];

  // Validate range: min must not exceed max
  if (
    criteria.engineDisplacementMin !== undefined &&
    criteria.engineDisplacementMax !== undefined &&
    criteria.engineDisplacementMin > criteria.engineDisplacementMax
  ) {
    errors.push({
      field: 'engineDisplacement',
      message: 'Minimum engine displacement must not exceed maximum',
    });
  }

  if (
    criteria.horsepowerMin !== undefined &&
    criteria.horsepowerMax !== undefined &&
    criteria.horsepowerMin > criteria.horsepowerMax
  ) {
    errors.push({
      field: 'horsepower',
      message: 'Minimum horsepower must not exceed maximum',
    });
  }

  if (
    criteria.yearMin !== undefined &&
    criteria.yearMax !== undefined &&
    criteria.yearMin > criteria.yearMax
  ) {
    errors.push({
      field: 'year',
      message: 'Minimum year must not exceed maximum',
    });
  }

  if (
    criteria.priceMin !== undefined &&
    criteria.priceMax !== undefined &&
    criteria.priceMin > criteria.priceMax
  ) {
    errors.push({
      field: 'price',
      message: 'Minimum price must not exceed maximum',
    });
  }

  // Validate field bounds
  if (criteria.engineDisplacementMin !== undefined && criteria.engineDisplacementMin < DISPLACEMENT_MIN) {
    errors.push({
      field: 'engineDisplacementMin',
      message: `Engine displacement minimum must be at least ${DISPLACEMENT_MIN}`,
    });
  }
  if (criteria.engineDisplacementMax !== undefined && criteria.engineDisplacementMax > DISPLACEMENT_MAX) {
    errors.push({
      field: 'engineDisplacementMax',
      message: `Engine displacement maximum must not exceed ${DISPLACEMENT_MAX}`,
    });
  }

  if (criteria.horsepowerMin !== undefined && criteria.horsepowerMin < HORSEPOWER_MIN) {
    errors.push({
      field: 'horsepowerMin',
      message: `Horsepower minimum must be at least ${HORSEPOWER_MIN}`,
    });
  }
  if (criteria.horsepowerMax !== undefined && criteria.horsepowerMax > HORSEPOWER_MAX) {
    errors.push({
      field: 'horsepowerMax',
      message: `Horsepower maximum must not exceed ${HORSEPOWER_MAX}`,
    });
  }

  if (criteria.yearMin !== undefined && criteria.yearMin < YEAR_MIN) {
    errors.push({
      field: 'yearMin',
      message: `Year minimum must be at least ${YEAR_MIN}`,
    });
  }
  if (criteria.yearMax !== undefined && criteria.yearMax > YEAR_MAX) {
    errors.push({
      field: 'yearMax',
      message: `Year maximum must not exceed ${YEAR_MAX}`,
    });
  }

  if (criteria.priceMin !== undefined && criteria.priceMin < PRICE_MIN) {
    errors.push({
      field: 'priceMin',
      message: `Price minimum must be at least ${PRICE_MIN}`,
    });
  }
  if (criteria.priceMax !== undefined && criteria.priceMax > PRICE_MAX) {
    errors.push({
      field: 'priceMax',
      message: `Price maximum must not exceed ${PRICE_MAX}`,
    });
  }

  // Validate search query if present in filter criteria
  if (criteria.searchQuery !== undefined) {
    const queryErrors = validateSearchQueryValue(criteria.searchQuery);
    errors.push(...queryErrors);
  }

  if (errors.length > 0) {
    next(validationError('Invalid filter criteria', errors));
    return;
  }

  next();
}

/**
 * Middleware that validates search query parameters (GET /api/search?q=...).
 * Returns 400 for queries that are too long (>100 characters).
 * Queries shorter than 2 characters are allowed through but will return empty results.
 */
export function validateSearchQuery(req: Request, _res: Response, next: NextFunction): void {
  const queryText = req.query.q;

  if (queryText === undefined || queryText === null || queryText === '') {
    next(validationError('Search query parameter "q" is required', [
      { field: 'q', message: 'Search query parameter "q" is required' },
    ]));
    return;
  }

  if (typeof queryText !== 'string') {
    next(validationError('Search query must be a string', [
      { field: 'q', message: 'Search query must be a string' },
    ]));
    return;
  }

  if (queryText.length > SEARCH_QUERY_MAX_LENGTH) {
    next(validationError(`Search query must not exceed ${SEARCH_QUERY_MAX_LENGTH} characters`, [
      { field: 'q', message: `Search query must not exceed ${SEARCH_QUERY_MAX_LENGTH} characters` },
    ]));
    return;
  }

  next();
}

/**
 * Validate search query value and return field-level errors.
 */
function validateSearchQueryValue(queryText: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (queryText.length < SEARCH_QUERY_MIN_LENGTH) {
    errors.push({
      field: 'searchQuery',
      message: `Search query must be at least ${SEARCH_QUERY_MIN_LENGTH} characters`,
    });
  }

  if (queryText.length > SEARCH_QUERY_MAX_LENGTH) {
    errors.push({
      field: 'searchQuery',
      message: `Search query must not exceed ${SEARCH_QUERY_MAX_LENGTH} characters`,
    });
  }

  return errors;
}
