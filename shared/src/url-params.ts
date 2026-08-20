/**
 * URL parameter serialization and deserialization for filter state.
 *
 * Provides round-trip encoding of FilterCriteria to/from URL query parameters,
 * using URL_PARAM_MAP for key mapping.
 */

import type { FilterCriteria } from './types';
import { URL_PARAM_MAP } from './constants';

/**
 * Fields that should be serialized as comma-separated number arrays.
 */
const NUMBER_ARRAY_FIELDS: ReadonlySet<string> = new Set(['doors', 'seats']);

/**
 * Fields that should be serialized as single numeric values.
 */
const NUMBER_FIELDS: ReadonlySet<string> = new Set(['accelerationMax', 'topSpeedMin']);

/**
 * Fields that should be serialized as booleans ('true' or omitted).
 */
const BOOLEAN_FIELDS: ReadonlySet<string> = new Set(['isSpecialEdition']);

/**
 * Fields that should be serialized as a single string value (not an array).
 */
const SINGLE_VALUE_FIELDS: ReadonlySet<string> = new Set(['performancePreset']);

/**
 * Serializes a FilterCriteria object into URLSearchParams.
 *
 * - Skips undefined, null, empty arrays, and false booleans
 * - Joins arrays with commas
 * - Represents booleans as 'true' (omit if false)
 * - Represents numbers as strings
 * - Uses URL_PARAM_MAP for param key names
 */
export function serializeFilters(state: Partial<FilterCriteria>): URLSearchParams {
  const params = new URLSearchParams();

  for (const [field, paramKey] of Object.entries(URL_PARAM_MAP)) {
    const value = (state as Record<string, unknown>)[field];

    // Skip undefined and null
    if (value === undefined || value === null) {
      continue;
    }

    if (BOOLEAN_FIELDS.has(field)) {
      // Only serialize 'true'; omit false
      if (value === true) {
        params.set(paramKey, 'true');
      }
    } else if (NUMBER_FIELDS.has(field)) {
      // Serialize number as string
      if (typeof value === 'number') {
        params.set(paramKey, String(value));
      }
    } else if (SINGLE_VALUE_FIELDS.has(field)) {
      // Single string value
      if (typeof value === 'string' && value.length > 0) {
        params.set(paramKey, value);
      }
    } else {
      // Array fields (string[] or number[])
      if (Array.isArray(value) && value.length > 0) {
        params.set(paramKey, value.join(','));
      }
    }
  }

  return params;
}

/**
 * Reversed URL_PARAM_MAP: maps URL param keys back to FilterCriteria field names.
 */
const REVERSE_PARAM_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(URL_PARAM_MAP).map(([field, param]) => [param, field])
);

/**
 * Deserializes URLSearchParams into a Partial<FilterCriteria>.
 *
 * - Splits comma-separated strings into arrays
 * - Parses numbers (doors, seats as number[], accelerationMax/topSpeedMin as number)
 * - Parses booleans
 * - Only includes fields that were present in the URL params
 */
export function deserializeFilters(params: URLSearchParams): Partial<FilterCriteria> {
  const result: Record<string, unknown> = {};

  for (const [paramKey, field] of Object.entries(REVERSE_PARAM_MAP)) {
    const raw = params.get(paramKey);

    if (raw === null || raw === '') {
      continue;
    }

    if (BOOLEAN_FIELDS.has(field)) {
      // Parse boolean: 'true' → true
      if (raw === 'true') {
        result[field] = true;
      }
    } else if (NUMBER_FIELDS.has(field)) {
      // Parse single number
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        result[field] = num;
      }
    } else if (SINGLE_VALUE_FIELDS.has(field)) {
      // Single string value
      result[field] = raw;
    } else if (NUMBER_ARRAY_FIELDS.has(field)) {
      // Parse comma-separated number array
      const numbers = raw.split(',').map(Number).filter((n) => !Number.isNaN(n));
      if (numbers.length > 0) {
        result[field] = numbers;
      }
    } else {
      // Parse comma-separated string array
      const values = raw.split(',').filter((v) => v.length > 0);
      if (values.length > 0) {
        result[field] = values;
      }
    }
  }

  return result as Partial<FilterCriteria>;
}
