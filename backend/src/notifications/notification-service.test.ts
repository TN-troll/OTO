import { describe, it, expect } from 'vitest';
import { matchesPreferences } from './notification-service.js';

describe('matchesPreferences', () => {
  describe('make matching', () => {
    it('matches when subscriber makes list is empty (all makes)', () => {
      const result = matchesPreferences(
        { make: 'BMW', price: 50000 },
        { makes: [], maxPrice: null }
      );
      expect(result).toBe(true);
    });

    it('matches when listing make is in subscriber makes list', () => {
      const result = matchesPreferences(
        { make: 'Porsche', price: 80000 },
        { makes: ['BMW', 'Porsche', 'Mercedes-Benz'], maxPrice: null }
      );
      expect(result).toBe(true);
    });

    it('does not match when listing make is NOT in subscriber makes list', () => {
      const result = matchesPreferences(
        { make: 'Toyota', price: 30000 },
        { makes: ['BMW', 'Porsche'], maxPrice: null }
      );
      expect(result).toBe(false);
    });

    it('matches case-insensitively', () => {
      const result = matchesPreferences(
        { make: 'bmw', price: 50000 },
        { makes: ['BMW'], maxPrice: null }
      );
      expect(result).toBe(true);
    });

    it('matches case-insensitively with different casing in subscriber list', () => {
      const result = matchesPreferences(
        { make: 'Mercedes-Benz', price: 60000 },
        { makes: ['mercedes-benz'], maxPrice: null }
      );
      expect(result).toBe(true);
    });
  });

  describe('price matching', () => {
    it('matches when maxPrice is null (no limit)', () => {
      const result = matchesPreferences(
        { make: 'BMW', price: 999999 },
        { makes: [], maxPrice: null }
      );
      expect(result).toBe(true);
    });

    it('matches when listing price equals maxPrice', () => {
      const result = matchesPreferences(
        { make: 'BMW', price: 50000 },
        { makes: [], maxPrice: 50000 }
      );
      expect(result).toBe(true);
    });

    it('matches when listing price is below maxPrice', () => {
      const result = matchesPreferences(
        { make: 'BMW', price: 40000 },
        { makes: [], maxPrice: 50000 }
      );
      expect(result).toBe(true);
    });

    it('does not match when listing price exceeds maxPrice', () => {
      const result = matchesPreferences(
        { make: 'BMW', price: 60000 },
        { makes: [], maxPrice: 50000 }
      );
      expect(result).toBe(false);
    });
  });

  describe('combined matching', () => {
    it('matches when both make and price criteria are satisfied', () => {
      const result = matchesPreferences(
        { make: 'Porsche', price: 75000 },
        { makes: ['Porsche', 'Ferrari'], maxPrice: 100000 }
      );
      expect(result).toBe(true);
    });

    it('does not match when make matches but price exceeds limit', () => {
      const result = matchesPreferences(
        { make: 'Porsche', price: 150000 },
        { makes: ['Porsche'], maxPrice: 100000 }
      );
      expect(result).toBe(false);
    });

    it('does not match when price is within limit but make is not in list', () => {
      const result = matchesPreferences(
        { make: 'Toyota', price: 25000 },
        { makes: ['Porsche', 'Ferrari'], maxPrice: 100000 }
      );
      expect(result).toBe(false);
    });

    it('does not match when neither make nor price match', () => {
      const result = matchesPreferences(
        { make: 'Toyota', price: 200000 },
        { makes: ['Porsche'], maxPrice: 100000 }
      );
      expect(result).toBe(false);
    });
  });
});
