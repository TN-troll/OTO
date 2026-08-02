import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReEvaluationJob } from './re-evaluation-job.js';
import { CurationEngine } from './curation-engine.js';
import type { ExclusiveModelEntry } from '@car-ads/shared';

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { query } from '../db/connection.js';
const mockQuery = vi.mocked(query);

function setupMockQuery(options: {
  luxuryBrands?: string[];
  exclusiveModels?: ExclusiveModelEntry[];
  activeListings?: Array<{ id: string; make: string; model: string; horsepower: number | null }>;
} = {}) {
  const {
    luxuryBrands = ['Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'McLaren'],
    exclusiveModels = [
      { make: 'Porsche', model: '911 GT3' },
      { make: 'BMW', model: 'M5' },
      { make: 'Nissan', model: 'GT-R' },
    ],
    activeListings = [],
  } = options;

  mockQuery.mockImplementation(async (text: string) => {
    if (typeof text === 'string' && text.includes("config_type = 'luxury_brands'")) {
      return {
        rows: [{ value: luxuryBrands }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      };
    }
    if (typeof text === 'string' && text.includes("config_type = 'exclusive_models'")) {
      return {
        rows: [{ value: exclusiveModels }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      };
    }
    if (typeof text === 'string' && text.includes('SELECT id, make, model, horsepower FROM listings')) {
      return {
        rows: activeListings,
        command: 'SELECT',
        rowCount: activeListings.length,
        oid: 0,
        fields: [],
      };
    }
    if (typeof text === 'string' && text.includes('SELECT id FROM curation_config')) {
      return { rows: [{ id: 'some-uuid' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
    }
    return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] };
  });
}

describe('ReEvaluationJob', () => {
  let engine: CurationEngine;
  let job: ReEvaluationJob;

  beforeEach(async () => {
    vi.clearAllMocks();
    engine = new CurationEngine();
    job = new ReEvaluationJob(engine);

    setupMockQuery();
    await engine.initialize();
  });

  describe('trigger()', () => {
    it('should re-evaluate all active listings and return counts', async () => {
      setupMockQuery({
        activeListings: [
          { id: '1', make: 'Ferrari', model: '488', horsepower: 670 },
          { id: '2', make: 'Toyota', model: 'Corolla', horsepower: 150 },
          { id: '3', make: 'Porsche', model: '911 GT3', horsepower: 500 },
        ],
      });

      const result = await job.trigger('luxury_brands_update');

      expect(result.totalEvaluated).toBe(3);
      expect(result.removedCount).toBe(1); // Toyota
      expect(result.updatedCount).toBe(2); // Ferrari, Porsche
      expect(result.trigger).toBe('luxury_brands_update');
      expect(result.triggeredAt).toBeInstanceOf(Date);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(result.triggeredAt.getTime());
    });

    it('should mark non-qualifying listings as inactive', async () => {
      setupMockQuery({
        luxuryBrands: ['Ferrari'],
        exclusiveModels: [],
        activeListings: [
          { id: '1', make: 'Toyota', model: 'Corolla', horsepower: 150 },
        ],
      });

      await job.trigger('luxury_brands_update');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'inactive'"),
        ['1'],
      );
    });

    it('should update criteria for qualifying listings', async () => {
      setupMockQuery({
        luxuryBrands: ['Ferrari'],
        exclusiveModels: [],
        activeListings: [
          { id: '2', make: 'Ferrari', model: '488', horsepower: 670 },
        ],
      });

      await job.trigger('luxury_brands_update');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('curation_criteria = $1'),
        [expect.arrayContaining(['hp_above_300', 'luxury_brand_match']), '2'],
      );
    });

    it('should handle empty listings', async () => {
      setupMockQuery({ activeListings: [] });

      const result = await job.trigger('exclusive_models_update');

      expect(result.totalEvaluated).toBe(0);
      expect(result.removedCount).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('should throw if already running', async () => {
      setupMockQuery({
        activeListings: [
          { id: '1', make: 'Ferrari', model: '488', horsepower: 670 },
        ],
      });

      // Start a trigger that we can control
      const firstTrigger = job.trigger('luxury_brands_update');

      // Attempting to trigger again should throw
      await expect(job.trigger('exclusive_models_update')).rejects.toThrow(
        'Re-evaluation job is already running.',
      );

      await firstTrigger;
    });

    it('should allow re-triggering after previous run completes', async () => {
      setupMockQuery({ activeListings: [] });

      await job.trigger('luxury_brands_update');
      const result = await job.trigger('exclusive_models_update');

      expect(result.trigger).toBe('exclusive_models_update');
    });

    it('should set running to false even if reEvaluateAll throws', async () => {
      // Engine is already initialized from beforeEach.
      // Now make the next query (inside reEvaluateAll -> loadConfig) throw.
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(job.trigger('luxury_brands_update')).rejects.toThrow('DB error');
      expect(job.isRunning()).toBe(false);
    });
  });

  describe('isRunning()', () => {
    it('should return false initially', () => {
      expect(job.isRunning()).toBe(false);
    });

    it('should return false after completion', async () => {
      setupMockQuery({ activeListings: [] });
      await job.trigger('luxury_brands_update');
      expect(job.isRunning()).toBe(false);
    });
  });

  describe('getLastResult()', () => {
    it('should return null before any run', () => {
      expect(job.getLastResult()).toBeNull();
    });

    it('should return the last result after a run', async () => {
      setupMockQuery({
        activeListings: [
          { id: '1', make: 'Ferrari', model: '488', horsepower: 670 },
        ],
      });

      await job.trigger('luxury_brands_update');

      const lastResult = job.getLastResult();
      expect(lastResult).not.toBeNull();
      expect(lastResult!.totalEvaluated).toBe(1);
      expect(lastResult!.updatedCount).toBe(1);
      expect(lastResult!.trigger).toBe('luxury_brands_update');
    });
  });

  describe('updateLuxuryBrandsAndReEvaluate()', () => {
    it('should update brands and trigger re-evaluation', async () => {
      setupMockQuery({
        activeListings: [
          { id: '1', make: 'Porsche', model: 'Cayenne', horsepower: 250 },
        ],
      });

      const result = await job.updateLuxuryBrandsAndReEvaluate(['Ferrari', 'Porsche']);

      // Should have called updateLuxuryBrands (UPDATE query)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE curation_config'),
        expect.any(Array),
      );
      expect(result.trigger).toBe('luxury_brands_update');
    });
  });

  describe('updateExclusiveModelsAndReEvaluate()', () => {
    it('should update models and trigger re-evaluation', async () => {
      setupMockQuery({
        activeListings: [
          { id: '1', make: 'Toyota', model: 'Supra', horsepower: 280 },
        ],
      });

      const models: ExclusiveModelEntry[] = [{ make: 'Toyota', model: 'Supra' }];
      const result = await job.updateExclusiveModelsAndReEvaluate(models);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE curation_config'),
        expect.any(Array),
      );
      expect(result.trigger).toBe('exclusive_models_update');
    });

    it('should correctly add listings that now qualify after model list update', async () => {
      // After the exclusive models update, the engine should pick up the new models
      // In our mock, after updateExclusiveModels is called, the next reEvaluateAll loads config
      // from the DB. We simulate this by making the DB return the new models.
      let modelsUpdated = false;

      mockQuery.mockImplementation(async (text: string, params?: unknown[]) => {
        if (typeof text === 'string' && text.includes('SELECT id FROM curation_config')) {
          return { rows: [{ id: 'some-uuid' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes('UPDATE curation_config') && params) {
          modelsUpdated = true;
          return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'luxury_brands'")) {
          return { rows: [{ value: ['Ferrari'] }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes("config_type = 'exclusive_models'")) {
          // After the update, return the new models
          const models = modelsUpdated
            ? [{ make: 'Toyota', model: 'Supra' }]
            : [];
          return { rows: [{ value: models }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }
        if (typeof text === 'string' && text.includes('SELECT id, make, model, horsepower FROM listings')) {
          return {
            rows: [
              { id: '1', make: 'Toyota', model: 'Supra', horsepower: 280 },
            ],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }
        return { rows: [], command: 'UPDATE', rowCount: 1, oid: 0, fields: [] };
      });

      const models: ExclusiveModelEntry[] = [{ make: 'Toyota', model: 'Supra' }];
      const result = await job.updateExclusiveModelsAndReEvaluate(models);

      // Toyota Supra should now qualify as exclusive model
      expect(result.updatedCount).toBe(1);
      expect(result.removedCount).toBe(0);

      // It should have updated the criteria for the listing
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('curation_criteria = $1'),
        [expect.arrayContaining(['exclusive_model_match']), '1'],
      );
    });
  });

  describe('re-evaluation timing constraint', () => {
    it('should complete re-evaluation promptly (well within 60 minutes)', async () => {
      setupMockQuery({
        activeListings: [
          { id: '1', make: 'Ferrari', model: '488', horsepower: 670 },
          { id: '2', make: 'Toyota', model: 'Corolla', horsepower: 150 },
          { id: '3', make: 'BMW', model: 'M5', horsepower: 600 },
        ],
      });

      const result = await job.trigger('luxury_brands_update');
      const durationMs = result.completedAt.getTime() - result.triggeredAt.getTime();

      // Should complete in well under 60 minutes (checking < 60000ms = 1 minute for unit test purposes)
      expect(durationMs).toBeLessThan(60_000);
    });
  });
});
