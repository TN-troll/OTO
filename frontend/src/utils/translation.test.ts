import { describe, it, expect } from 'vitest';
import { resolveTranslation } from './translation';

describe('resolveTranslation', () => {
  const nlDescription = 'Dit is een mooie auto met veel opties.';
  const enTranslation = 'This is a beautiful car with many options.';

  describe('when locale is "nl"', () => {
    it('returns the original description unchanged', () => {
      const result = resolveTranslation(nlDescription, enTranslation, 'nl');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('none');
    });

    it('returns description even when descriptionEn is null', () => {
      const result = resolveTranslation(nlDescription, null, 'nl');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('none');
    });

    it('returns description even when descriptionEn is empty', () => {
      const result = resolveTranslation(nlDescription, '', 'nl');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('none');
    });
  });

  describe('when locale is "en" and descriptionEn is valid', () => {
    it('returns the English translation with "translated" badge', () => {
      const result = resolveTranslation(nlDescription, enTranslation, 'en');
      expect(result.text).toBe(enTranslation);
      expect(result.badge).toBe('translated');
    });
  });

  describe('when locale is "en" and descriptionEn is invalid', () => {
    it('falls back to Dutch when descriptionEn is null', () => {
      const result = resolveTranslation(nlDescription, null, 'en');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('original-nl');
    });

    it('falls back to Dutch when descriptionEn is empty string', () => {
      const result = resolveTranslation(nlDescription, '', 'en');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('original-nl');
    });

    it('falls back to Dutch when descriptionEn is whitespace-only', () => {
      const result = resolveTranslation(nlDescription, '   ', 'en');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('original-nl');
    });

    it('falls back to Dutch when descriptionEn is literal "null"', () => {
      const result = resolveTranslation(nlDescription, 'null', 'en');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('original-nl');
    });

    it('falls back to Dutch when descriptionEn is literal "undefined"', () => {
      const result = resolveTranslation(nlDescription, 'undefined', 'en');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('original-nl');
    });

    it('falls back to Dutch when descriptionEn is tabs and newlines only', () => {
      const result = resolveTranslation(nlDescription, '\t\n  \r\n', 'en');
      expect(result.text).toBe(nlDescription);
      expect(result.badge).toBe('original-nl');
    });
  });

  describe('defensive case: description is null/empty', () => {
    it('returns empty string when description is empty', () => {
      const result = resolveTranslation('', enTranslation, 'en');
      expect(result.text).toBe('');
      expect(result.badge).toBe('none');
    });

    it('returns empty string when description is whitespace-only', () => {
      const result = resolveTranslation('   ', null, 'nl');
      expect(result.text).toBe('');
      expect(result.badge).toBe('none');
    });

    it('does not throw when description is empty and locale is en', () => {
      expect(() => resolveTranslation('', null, 'en')).not.toThrow();
      const result = resolveTranslation('', null, 'en');
      expect(result.text).toBe('');
      expect(result.badge).toBe('none');
    });
  });
});
