import { describe, it, expect } from 'vitest';
import { DUTCH_CITY_COORDS, geocodeCity, isGeocodable } from './geocoding';

describe('GeocodingService', () => {
  describe('DUTCH_CITY_COORDS lookup table', () => {
    it('has at least 50 entries', () => {
      expect(DUTCH_CITY_COORDS.size).toBeGreaterThanOrEqual(50);
    });

    it('contains all 12 provincial capitals', () => {
      const provincialCapitals = [
        'amsterdam',       // Noord-Holland
        'haarlem',         // Noord-Holland (administrative capital)
        'den haag',        // Zuid-Holland
        'utrecht',         // Utrecht
        'groningen',       // Groningen
        'leeuwarden',      // Friesland
        'assen',           // Drenthe
        'zwolle',          // Overijssel
        'arnhem',          // Gelderland
        "'s-hertogenbosch", // Noord-Brabant
        'maastricht',      // Limburg
        'middelburg',      // Zeeland
        'lelystad',        // Flevoland
      ];

      for (const capital of provincialCapitals) {
        expect(DUTCH_CITY_COORDS.has(capital), `Missing provincial capital: ${capital}`).toBe(true);
      }
    });
  });

  describe('geocodeCity', () => {
    it('returns coordinates for a known city', () => {
      const result = geocodeCity('Amsterdam');
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(52.3676, 3);
      expect(result!.longitude).toBeCloseTo(4.9041, 3);
    });

    it('is case-insensitive (uppercase)', () => {
      const result = geocodeCity('AMSTERDAM');
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(52.3676, 3);
    });

    it('is case-insensitive (lowercase)', () => {
      const result = geocodeCity('amsterdam');
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(52.3676, 3);
    });

    it('is case-insensitive (mixed case)', () => {
      const result = geocodeCity('AmStErDaM');
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(52.3676, 3);
    });

    it('returns the same coordinates regardless of case', () => {
      const lower = geocodeCity('rotterdam');
      const upper = geocodeCity('ROTTERDAM');
      const mixed = geocodeCity('Rotterdam');

      expect(lower).toEqual(upper);
      expect(upper).toEqual(mixed);
    });

    it('trims whitespace from input', () => {
      const result = geocodeCity('  amsterdam  ');
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(52.3676, 3);
    });

    it('returns null for unknown city', () => {
      expect(geocodeCity('nonexistentcity')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(geocodeCity('')).toBeNull();
    });

    it('returns null for whitespace-only string', () => {
      expect(geocodeCity('   ')).toBeNull();
    });
  });

  describe('isGeocodable', () => {
    it('returns true for a known city', () => {
      expect(isGeocodable('Amsterdam')).toBe(true);
    });

    it('returns true case-insensitively', () => {
      expect(isGeocodable('UTRECHT')).toBe(true);
    });

    it('returns false for null', () => {
      expect(isGeocodable(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isGeocodable(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isGeocodable('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(isGeocodable('   ')).toBe(false);
    });

    it('returns false for unknown city', () => {
      expect(isGeocodable('FakeCity123')).toBe(false);
    });
  });
});
