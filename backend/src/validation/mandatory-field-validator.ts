import type { RawAdvertisement } from '@car-ads/shared';

export interface MandatoryFieldValidationResult {
  valid: boolean;
  missingFields: string[];
}

const MANDATORY_FIELDS: (keyof RawAdvertisement)[] = ['price', 'make', 'model', 'year'];

/**
 * Validates that a RawAdvertisement has all mandatory fields present (not null).
 * Mandatory fields: price, make, model, year.
 */
export function validateMandatoryFields(ad: RawAdvertisement): MandatoryFieldValidationResult {
  const missingFields: string[] = [];

  for (const field of MANDATORY_FIELDS) {
    if (ad[field] === null || ad[field] === undefined) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
