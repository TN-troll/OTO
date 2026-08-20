import { describe, it, expect } from 'vitest';
import { serializeFilters, deserializeFilters } from './url-params';
import type { FilterCriteria } from './types';

describe('serializeFilters', () => {
  it('serializes string array fields as comma-separated values', () => {
    const state: Partial<FilterCriteria> = {
      drivetrain: ['rwd', 'awd'],
      color: ['black', 'white'],
      sellerType: ['dealer'],
    };
    const params = serializeFilters(state);
    expect(params.get('drivetrain')).toBe('rwd,awd');
    expect(params.get('color')).toBe('black,white');
    expect(params.get('sellerType')).toBe('dealer');
  });

  it('serializes number array fields as comma-separated values', () => {
    const state: Partial<FilterCriteria> = {
      doors: [2, 4],
      seats: [4, 5, 7],
    };
    const params = serializeFilters(state);
    expect(params.get('doors')).toBe('2,4');
    expect(params.get('seats')).toBe('4,5,7');
  });

  it('serializes boolean fields as "true" and omits false', () => {
    const stateTrue: Partial<FilterCriteria> = { isSpecialEdition: true };
    const stateFalse: Partial<FilterCriteria> = { isSpecialEdition: false };

    expect(serializeFilters(stateTrue).get('specialEdition')).toBe('true');
    expect(serializeFilters(stateFalse).has('specialEdition')).toBe(false);
  });

  it('serializes number fields as string values', () => {
    const state: Partial<FilterCriteria> = {
      accelerationMax: 4.0,
      topSpeedMin: 300,
    };
    const params = serializeFilters(state);
    expect(params.get('accelMax')).toBe('4');
    expect(params.get('topSpeedMin')).toBe('300');
  });

  it('serializes single-value fields', () => {
    const state: Partial<FilterCriteria> = {
      performancePreset: 'v8_grand_tourers',
    };
    const params = serializeFilters(state);
    expect(params.get('preset')).toBe('v8_grand_tourers');
  });

  it('skips undefined, null, and empty arrays', () => {
    const state: Partial<FilterCriteria> = {
      drivetrain: [],
      color: undefined,
      performancePreset: null,
      doors: [],
    };
    const params = serializeFilters(state);
    expect(params.toString()).toBe('');
  });

  it('serializes all premium filter fields together', () => {
    const state: Partial<FilterCriteria> = {
      drivetrain: ['awd'],
      condition: ['new', 'used'],
      engineDetailConfiguration: ['v8', 'v12'],
      forcedInductionDetail: ['twin_turbo'],
      heritageEra: ['classic', 'modern_classic'],
      isSpecialEdition: true,
      accelerationMax: 3.5,
      topSpeedMin: 250,
      performancePreset: 'track_weapons',
    };
    const params = serializeFilters(state);
    expect(params.get('drivetrain')).toBe('awd');
    expect(params.get('condition')).toBe('new,used');
    expect(params.get('engineConfig')).toBe('v8,v12');
    expect(params.get('induction')).toBe('twin_turbo');
    expect(params.get('era')).toBe('classic,modern_classic');
    expect(params.get('specialEdition')).toBe('true');
    expect(params.get('accelMax')).toBe('3.5');
    expect(params.get('topSpeedMin')).toBe('250');
    expect(params.get('preset')).toBe('track_weapons');
  });
});

describe('deserializeFilters', () => {
  it('deserializes comma-separated string arrays', () => {
    const params = new URLSearchParams('drivetrain=rwd,awd&color=black,white');
    const result = deserializeFilters(params);
    expect(result.drivetrain).toEqual(['rwd', 'awd']);
    expect(result.color).toEqual(['black', 'white']);
  });

  it('deserializes comma-separated number arrays', () => {
    const params = new URLSearchParams('doors=2,4&seats=4,5,7');
    const result = deserializeFilters(params);
    expect(result.doors).toEqual([2, 4]);
    expect(result.seats).toEqual([4, 5, 7]);
  });

  it('deserializes boolean fields', () => {
    const params = new URLSearchParams('specialEdition=true');
    const result = deserializeFilters(params);
    expect(result.isSpecialEdition).toBe(true);
  });

  it('does not include boolean fields when absent', () => {
    const params = new URLSearchParams('drivetrain=rwd');
    const result = deserializeFilters(params);
    expect(result.isSpecialEdition).toBeUndefined();
  });

  it('deserializes number fields', () => {
    const params = new URLSearchParams('accelMax=3.5&topSpeedMin=300');
    const result = deserializeFilters(params);
    expect(result.accelerationMax).toBe(3.5);
    expect(result.topSpeedMin).toBe(300);
  });

  it('deserializes single-value fields', () => {
    const params = new URLSearchParams('preset=daily_luxury');
    const result = deserializeFilters(params);
    expect(result.performancePreset).toBe('daily_luxury');
  });

  it('ignores unknown params', () => {
    const params = new URLSearchParams('unknownParam=foo&drivetrain=rwd');
    const result = deserializeFilters(params);
    expect(result.drivetrain).toEqual(['rwd']);
    expect((result as Record<string, unknown>)['unknownParam']).toBeUndefined();
  });

  it('returns empty object for empty params', () => {
    const params = new URLSearchParams('');
    const result = deserializeFilters(params);
    expect(result).toEqual({});
  });

  it('handles empty values gracefully', () => {
    const params = new URLSearchParams('drivetrain=&doors=');
    const result = deserializeFilters(params);
    expect(result.drivetrain).toBeUndefined();
    expect(result.doors).toBeUndefined();
  });
});

describe('round-trip serialization', () => {
  it('round-trips a full filter state', () => {
    const state: Partial<FilterCriteria> = {
      drivetrain: ['rwd', 'awd'],
      color: ['red', 'blue'],
      sellerType: ['dealer', 'private'],
      doors: [2, 4],
      seats: [2, 5],
      condition: ['new', 'classic'],
      performancePreset: 'classic_collectibles',
      engineDetailConfiguration: ['inline-6', 'v8'],
      forcedInductionDetail: ['naturally_aspirated', 'supercharged'],
      heritageEra: ['classic', 'contemporary'],
      isSpecialEdition: true,
      accelerationMax: 4.2,
      topSpeedMin: 280,
    };

    const serialized = serializeFilters(state);
    const deserialized = deserializeFilters(serialized);
    expect(deserialized).toEqual(state);
  });

  it('round-trips a minimal state', () => {
    const state: Partial<FilterCriteria> = {
      drivetrain: ['fwd'],
    };
    const serialized = serializeFilters(state);
    const deserialized = deserializeFilters(serialized);
    expect(deserialized).toEqual(state);
  });

  it('round-trips with only numeric fields', () => {
    const state: Partial<FilterCriteria> = {
      accelerationMax: 5.5,
      topSpeedMin: 200,
    };
    const serialized = serializeFilters(state);
    const deserialized = deserializeFilters(serialized);
    expect(deserialized).toEqual(state);
  });
});
