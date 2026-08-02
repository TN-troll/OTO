import { describe, it, expect } from 'vitest';

/**
 * Unit tests for SearchBar logic.
 * These tests validate the core business rules without DOM rendering.
 */

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

const KNOWN_ABBREVIATIONS: Record<string, string> = {
  merc: 'Mercedes-Benz',
  mercedes: 'Mercedes-Benz',
  chevy: 'Chevrolet',
  lambo: 'Lamborghini',
  beemer: 'BMW',
  bimmer: 'BMW',
  vette: 'Corvette',
  aston: 'Aston Martin',
  astonmartin: 'Aston Martin',
  porsche: 'Porsche',
};

function isQueryValid(query: string): boolean {
  const trimmed = query.trim();
  return trimmed.length >= MIN_QUERY_LENGTH && trimmed.length <= MAX_QUERY_LENGTH;
}

function shouldSearch(query: string): boolean {
  return query.trim().length >= MIN_QUERY_LENGTH;
}

function getExpandedName(query: string): string | undefined {
  return KNOWN_ABBREVIATIONS[query.toLowerCase()];
}

function enforceMaxLength(value: string): string {
  return value.slice(0, MAX_QUERY_LENGTH);
}

describe('SearchBar logic', () => {
  describe('Query validation', () => {
    it('rejects queries shorter than 2 characters', () => {
      expect(isQueryValid('')).toBe(false);
      expect(isQueryValid('a')).toBe(false);
      expect(isQueryValid(' ')).toBe(false);
      expect(isQueryValid(' a ')).toBe(false);
    });

    it('accepts queries of 2 characters or more', () => {
      expect(isQueryValid('ab')).toBe(true);
      expect(isQueryValid('ferrari')).toBe(true);
      expect(isQueryValid('me')).toBe(true);
    });

    it('accepts queries up to 100 characters', () => {
      const longQuery = 'a'.repeat(100);
      expect(isQueryValid(longQuery)).toBe(true);
    });

    it('rejects queries longer than 100 characters', () => {
      const tooLong = 'a'.repeat(101);
      expect(isQueryValid(tooLong)).toBe(false);
    });

    it('trims whitespace before validating', () => {
      expect(isQueryValid('  ab  ')).toBe(true);
      expect(isQueryValid('  a  ')).toBe(false);
    });
  });

  describe('Minimum character enforcement', () => {
    it('does not trigger search for empty input', () => {
      expect(shouldSearch('')).toBe(false);
    });

    it('does not trigger search for single character', () => {
      expect(shouldSearch('a')).toBe(false);
    });

    it('triggers search for 2+ characters', () => {
      expect(shouldSearch('ab')).toBe(true);
      expect(shouldSearch('porsche 911')).toBe(true);
    });

    it('does not trigger search for whitespace-only input', () => {
      expect(shouldSearch('   ')).toBe(false);
    });
  });

  describe('Maximum length enforcement', () => {
    it('truncates input at 100 characters', () => {
      const input = 'x'.repeat(150);
      const enforced = enforceMaxLength(input);
      expect(enforced.length).toBe(100);
    });

    it('does not modify input under 100 characters', () => {
      const input = 'Ferrari 488 GTB';
      expect(enforceMaxLength(input)).toBe(input);
    });

    it('preserves exactly 100 character input', () => {
      const input = 'a'.repeat(100);
      expect(enforceMaxLength(input)).toBe(input);
    });
  });

  describe('Abbreviation expansion', () => {
    it('expands "merc" to "Mercedes-Benz"', () => {
      expect(getExpandedName('merc')).toBe('Mercedes-Benz');
    });

    it('expands "chevy" to "Chevrolet"', () => {
      expect(getExpandedName('chevy')).toBe('Chevrolet');
    });

    it('expands "lambo" to "Lamborghini"', () => {
      expect(getExpandedName('lambo')).toBe('Lamborghini');
    });

    it('expands "beemer" to "BMW"', () => {
      expect(getExpandedName('beemer')).toBe('BMW');
    });

    it('expands "bimmer" to "BMW"', () => {
      expect(getExpandedName('bimmer')).toBe('BMW');
    });

    it('expands "aston" to "Aston Martin"', () => {
      expect(getExpandedName('aston')).toBe('Aston Martin');
    });

    it('is case-insensitive', () => {
      expect(getExpandedName('MERC')).toBe('Mercedes-Benz');
      expect(getExpandedName('Lambo')).toBe('Lamborghini');
    });

    it('returns undefined for non-abbreviation queries', () => {
      expect(getExpandedName('ferrari')).toBeUndefined();
      expect(getExpandedName('some random car')).toBeUndefined();
    });
  });
});
