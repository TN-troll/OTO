import { describe, it, expect } from 'vitest';
import { getMaintenanceTierInfo, MAINTENANCE_LOOKUP } from './maintenanceLookup';

describe('maintenanceLookup', () => {
  describe('getMaintenanceTierInfo', () => {
    it('returns low tier with green color for Toyota', () => {
      const result = getMaintenanceTierInfo('Toyota');
      expect(result.tier).toBe('low');
      expect(result.color).toBe('green');
      expect(result.label).toBe('Low');
      expect(result.estimatedAnnualRange).toBe('€500 – €1,000');
    });

    it('returns medium tier with amber color for BMW', () => {
      const result = getMaintenanceTierInfo('BMW');
      expect(result.tier).toBe('medium');
      expect(result.color).toBe('amber');
      expect(result.label).toBe('Medium');
      expect(result.estimatedAnnualRange).toBe('€1,000 – €2,500');
    });

    it('returns high tier with red color for Ferrari', () => {
      const result = getMaintenanceTierInfo('Ferrari');
      expect(result.tier).toBe('high');
      expect(result.color).toBe('red');
      expect(result.label).toBe('High');
      expect(result.estimatedAnnualRange).toBe('€2,500 – €5,000+');
    });

    it('returns unknown tier with grey color for unrecognized makes', () => {
      const result = getMaintenanceTierInfo('UnknownBrand');
      expect(result.tier).toBe('unknown');
      expect(result.color).toBe('grey');
      expect(result.label).toBe('Unknown');
      expect(result.estimatedAnnualRange).toBe('Not available');
    });

    it('is case-insensitive - lowercase input', () => {
      const result = getMaintenanceTierInfo('toyota');
      expect(result.tier).toBe('low');
    });

    it('is case-insensitive - uppercase input', () => {
      const result = getMaintenanceTierInfo('BMW');
      expect(result.tier).toBe('medium');
    });

    it('is case-insensitive - mixed case input', () => {
      const result = getMaintenanceTierInfo('fErRaRi');
      expect(result.tier).toBe('high');
    });

    it('handles makes with spaces (case-insensitive)', () => {
      const result = getMaintenanceTierInfo('aston martin');
      expect(result.tier).toBe('high');
    });

    it('handles makes with hyphens (case-insensitive)', () => {
      const result = getMaintenanceTierInfo('mercedes-benz');
      expect(result.tier).toBe('medium');
    });

    it('handles makes with special characters', () => {
      const result = getMaintenanceTierInfo('rolls-royce');
      expect(result.tier).toBe('high');
    });

    it('trims whitespace from input', () => {
      const result = getMaintenanceTierInfo('  BMW  ');
      expect(result.tier).toBe('medium');
    });

    it('returns unknown for empty string', () => {
      const result = getMaintenanceTierInfo('');
      expect(result.tier).toBe('unknown');
    });
  });

  describe('MAINTENANCE_LOOKUP', () => {
    it('contains all expected low-tier makes', () => {
      const lowMakes = Object.entries(MAINTENANCE_LOOKUP)
        .filter(([, tier]) => tier === 'low')
        .map(([make]) => make);
      expect(lowMakes).toContain('Toyota');
      expect(lowMakes).toContain('Honda');
      expect(lowMakes).toContain('Mazda');
    });

    it('contains all expected medium-tier makes', () => {
      const mediumMakes = Object.entries(MAINTENANCE_LOOKUP)
        .filter(([, tier]) => tier === 'medium')
        .map(([make]) => make);
      expect(mediumMakes).toContain('BMW');
      expect(mediumMakes).toContain('Mercedes-Benz');
      expect(mediumMakes).toContain('Audi');
    });

    it('contains all expected high-tier makes', () => {
      const highMakes = Object.entries(MAINTENANCE_LOOKUP)
        .filter(([, tier]) => tier === 'high')
        .map(([make]) => make);
      expect(highMakes).toContain('Porsche');
      expect(highMakes).toContain('Ferrari');
      expect(highMakes).toContain('Lamborghini');
    });

    it('has only valid tier values', () => {
      const validTiers = ['low', 'medium', 'high'];
      Object.values(MAINTENANCE_LOOKUP).forEach((tier) => {
        expect(validTiers).toContain(tier);
      });
    });
  });
});
