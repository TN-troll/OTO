// Feature: interactive-dealer-map, Property 1: Geocoding coordinates within Netherlands bounds
// Feature: interactive-dealer-map, Property 2: Case-insensitive geocoding returns consistent coordinates
// Feature: interactive-dealer-map, Property 3: Unknown locations return null

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DUTCH_CITY_COORDS, geocodeCity } from './geocoding';

/**
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */

describe('Geocoding Service - Property Tests', () => {
  // Property 1: Geocoding coordinates within Netherlands bounds
  // For any entry in the lookup table, latitude is between 50.7–53.6
  // and longitude is between 3.3–7.3
  it('Property 1: All coordinates are within Netherlands bounding box', () => {
    const cities = Array.from(DUTCH_CITY_COORDS.keys());

    fc.assert(
      fc.property(
        fc.constantFrom(...cities),
        (city) => {
          const coords = geocodeCity(city);
          expect(coords).not.toBeNull();
          expect(coords!.latitude).toBeGreaterThanOrEqual(50.7);
          expect(coords!.latitude).toBeLessThanOrEqual(53.6);
          expect(coords!.longitude).toBeGreaterThanOrEqual(3.3);
          expect(coords!.longitude).toBeLessThanOrEqual(7.3);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: Case-insensitive geocoding returns consistent coordinates
  // For any city name and any case variation, geocodeCity returns the same coordinates
  it('Property 2: Case-insensitive lookup returns consistent coordinates', () => {
    const cities = Array.from(DUTCH_CITY_COORDS.keys());

    fc.assert(
      fc.property(
        fc.constantFrom(...cities),
        (city) => {
          const canonical = geocodeCity(city);

          // Test various case transformations
          const upper = geocodeCity(city.toUpperCase());
          const mixed = geocodeCity(
            city
              .split('')
              .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
              .join('')
          );
          const withSpaces = geocodeCity(`  ${city}  `);

          expect(upper).toEqual(canonical);
          expect(mixed).toEqual(canonical);
          expect(withSpaces).toEqual(canonical);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Unknown locations return null
  // For any string not in the lookup table, geocodeCity returns null
  it('Property 3: Unknown city names return null', () => {
    const knownCities = new Set(
      Array.from(DUTCH_CITY_COORDS.keys()).map((c) => c.toLowerCase())
    );

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !knownCities.has(s.trim().toLowerCase())
        ),
        (unknownCity) => {
          const result = geocodeCity(unknownCity);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
