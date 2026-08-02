import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CurationEngine } from './curation-engine.js';
import type { RawAdvertisement } from '@car-ads/shared';

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../db/connection.js';
const mockQuery = vi.mocked(query);

function makeAd(overrides: Partial<RawAdvertisement> = {}): RawAdvertisement {
  return {
    title: 'Test Car',
    price: 50000,
    mileage: 10000,
    year: 2022,
    make: 'Toyota',
    model: 'Corolla',
    engineDisplacementCc: 2000,
    horsepower: 150,
    location: 'Amsterdam',
    sellerType: 'dealer',
    sourceUrl: 'https://example.com/car/1',
    imageUrls: ['https://example.com/img1.jpg'],
    transmissionType: 'automatic',
    fuelType: 'petrol',
    ...overrides,
  };
}

describe('CurationEngine', () => {
  let engine: CurationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new CurationEngine();

    // Default mock: return config from database
    mockQuery.mockImplementation(async (text: string) => {
      if (typeof text === 'string' && text.includes("config_type = 'luxury_brands'")) {
        return {
          rows: [{ value: ['Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'McLaren', 'Aston Martin', 'Bugatti'] }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }
      if (typeof text === 'string' && text.includes("config_type = 'exclusive_models'")) {
        return {
          rows: [{
            value: [
              { make: 'Porsche', model: '911 GT3' },
              { make: 'BMW', model: 'M5' },
              { make: 'Mercedes', model: 'AMG GT' },
              { make: 'Audi', model: 'R8' },
              { make: 'Nissan', model: 'GT-R' },
            ],
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }
      return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
    });
  });

  describe('initialize()', () => {
    it('should load config from database', async () => {
      await engine.initialize();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should throw if evaluate is called before initialize', () => {
      const ad = makeAd();
      expect(() => engine.evaluate(ad)).toThrow('CurationEngine not initialized');
    });
  });

  describe('evaluate()', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should qualify a car with HP > 300', () => {
      const ad = makeAd({ horsepower: 450, make: 'Toyota', model: 'Supra' });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('horsepower');
      expect(result.matchedCriteria).toContain('hp_above_300');
    });

    it('should qualify a luxury brand', () => {
      const ad = makeAd({ make: 'Ferrari', model: '488', horsepower: 200 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('luxury_brand');
      expect(result.matchedCriteria).toContain('luxury_brand_match');
    });

    it('should qualify an exclusive model', () => {
      const ad = makeAd({ make: 'Porsche', model: '911 GT3', horsepower: 200 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('exclusive_model_match');
    });

    it('should perform case-insensitive brand matching', () => {
      const ad = makeAd({ make: 'FERRARI', model: 'Roma', horsepower: 100 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('luxury_brand_match');
    });

    it('should perform case-insensitive model matching', () => {
      const ad = makeAd({ make: 'porsche', model: '911 gt3', horsepower: 100 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('exclusive_model_match');
    });

    it('should not qualify a regular car with low HP', () => {
      const ad = makeAd({ make: 'Toyota', model: 'Corolla', horsepower: 150 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('not_eligible');
      expect(result.matchedCriteria).toHaveLength(0);
    });

    it('should skip HP criterion when HP is null', () => {
      const ad = makeAd({ make: 'Toyota', model: 'Corolla', horsepower: null });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(false);
      expect(result.matchedCriteria).not.toContain('hp_above_300');
    });

    it('should skip HP criterion when HP is 0', () => {
      const ad = makeAd({ make: 'Toyota', model: 'Corolla', horsepower: 0 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(false);
      expect(result.matchedCriteria).not.toContain('hp_above_300');
    });

    it('should still evaluate brand/model when HP is null', () => {
      const ad = makeAd({ make: 'Ferrari', model: '488', horsepower: null });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('luxury_brand_match');
      expect(result.matchedCriteria).not.toContain('hp_above_300');
    });

    it('should match multiple criteria (OR logic)', () => {
      const ad = makeAd({ make: 'Ferrari', model: '488', horsepower: 670 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('hp_above_300');
      expect(result.matchedCriteria).toContain('luxury_brand_match');
    });

    it('should not qualify when make is null', () => {
      const ad = makeAd({ make: null, model: null, horsepower: 100 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(false);
    });

    it('should qualify HP > 300 even when make is null', () => {
      const ad = makeAd({ make: null, model: null, horsepower: 500 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('hp_above_300');
    });

    it('should not qualify HP exactly at 300', () => {
      const ad = makeAd({ make: 'Toyota', model: 'Supra', horsepower: 300 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(false);
    });

    it('should qualify HP at 301', () => {
      const ad = makeAd({ make: 'Toyota', model: 'Supra', horsepower: 301 });
      const result = engine.evaluate(ad);

      expect(result.eligible).toBe(true);
      expect(result.matchedCriteria).toContain('hp_above_300');
    });
  });

  describe('getLuxuryBrands()', () => {
    it('should return the brands from the database', async () => {
      const brands = await engine.getLuxuryBrands();
      expect(brands).toEqual(['Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'McLaren', 'Aston Martin', 'Bugatti']);
    });
  });

  describe('getExclusiveModels()', () => {
    it('should return the models from the database', async () => {
      const models = await engine.getExclusiveModels();
      expect(models).toEqual([
        { make: 'Porsche', model: '911 GT3' },
        { make: 'BMW', model: 'M5' },
        { make: 'Mercedes', model: 'AMG GT' },
        { make: 'Audi', model: 'R8' },
        { make: 'Nissan', model: 'GT-R' },
      ]);
    });
  });

  describe('updateLuxuryBrands()', () => {
    it('should insert when no existing config', async () => {
      mockQuery.mockImplementation(async (text: string) => {
        if (typeof text === 'string' && text.includes('SELECT id FROM curation_config')) {
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'luxury_brands'")) {
          return { rows: [{ value: ['Ferrari', 'Porsche'] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'exclusive_models'")) {
          return { rows: [{ value: [] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] };
      });

      await engine.updateLuxuryBrands(['Ferrari', 'Porsche']);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO curation_config'),
        expect.any(Array),
      );
    });

    it('should update when existing config exists', async () => {
      mockQuery.mockImplementation(async (text: string) => {
        if (typeof text === 'string' && text.includes('SELECT id FROM curation_config')) {
          return { rows: [{ id: 'some-uuid' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'luxury_brands'")) {
          return { rows: [{ value: ['Ferrari', 'Porsche'] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'exclusive_models'")) {
          return { rows: [{ value: [] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] };
      });

      await engine.updateLuxuryBrands(['Ferrari', 'Porsche']);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE curation_config'),
        expect.any(Array),
      );
    });
  });

  describe('reEvaluateAll()', () => {
    it('should mark non-qualifying listings as inactive', async () => {
      mockQuery.mockImplementation(async (text: string) => {
        if (typeof text === 'string' && text.includes("config_type = 'luxury_brands'")) {
          return { rows: [{ value: ['Ferrari'] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'exclusive_models'")) {
          return { rows: [{ value: [] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes('SELECT id, make, model, horsepower FROM listings')) {
          return {
            rows: [
              { id: '1', make: 'Toyota', model: 'Corolla', horsepower: 150 },
              { id: '2', make: 'Ferrari', model: '488', horsepower: 670 },
            ],
            command: 'SELECT',
            rowCount: 2,
            oid: 0,
            fields: [],
          };
        }
        return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] };
      });

      await engine.initialize();
      await engine.reEvaluateAll();

      // Toyota should be marked inactive
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'inactive'"),
        ['1'],
      );

      // Ferrari should have its criteria updated
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('curation_criteria = $1'),
        [expect.arrayContaining(['hp_above_300', 'luxury_brand_match']), '2'],
      );
    });
  });
});
