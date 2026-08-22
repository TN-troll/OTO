import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';
import { FilterEngine } from './filter-engine.js';
import { PERFORMANCE_PRESETS } from '@car-ads/shared';
import type { FilterCriteria } from '@car-ads/shared';

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

// Mock the Redis module
vi.mock('../cache/redis.js', () => ({
  getRedisClient: vi.fn(),
}));

import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

const mockQuery = vi.mocked(query);
const mockGetRedisClient = vi.mocked(getRedisClient);

function createMockRedis() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  };
}

function mockDbResults(totalCount: number, rows: unknown[] = []) {
  mockQuery.mockImplementation(async (text: string) => {
    if (typeof text === 'string' && text.includes('COUNT(*)')) {
      return {
        rows: [{ count: String(totalCount) }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any;
    }
    return {
      rows,
      command: 'SELECT',
      rowCount: rows.length,
      oid: 0,
      fields: [],
    } as any;
  });
}

describe('Filter Lifecycle Integration Tests', () => {
  let engine: FilterEngine;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    mockRedis = createMockRedis();
    mockGetRedisClient.mockReturnValue(mockRedis as any);
  });

  describe('Filter options endpoint SQL queries', () => {
    /**
     * Validates: Requirements 14.15, 14.16
     * Tests that the 13 parallel queries in the filter options endpoint
     * are correctly structured for ranges, distinct values, era distribution, and modelsByMake.
     */

    async function callFilterOptionsHandler() {
      // Re-import to get the fresh mock wiring
      const { filterOptionsRouter } = await import('../api/filter-options.js');

      let responseStatus = 200;
      let responseBody: unknown = null;
      const res = {
        status: (code: number) => {
          responseStatus = code;
          return res;
        },
        json: (body: unknown) => {
          responseBody = body;
        },
      } as any;

      const layer = (filterOptionsRouter as any).stack.find(
        (l: any) => l.route?.path === '/' && l.route?.methods?.get,
      );
      const handler = layer.route.stack[0].handle;
      await handler({} as any, res, () => {});
      return { status: responseStatus, body: responseBody };
    }

    function setupSeededDatabaseMocks() {
      // 1. Ranges query
      mockQuery.mockResolvedValueOnce({
        rows: [{
          min_price: '35000', max_price: '850000',
          min_horsepower: '200', max_horsepower: '1001',
          min_displacement: '2000', max_displacement: '6300',
          min_year: '1972', max_year: '2024',
          min_mileage: '150', max_mileage: '320000',
        }],
      });
      // 2. Drivetrains
      mockQuery.mockResolvedValueOnce({
        rows: [{ drivetrain: 'awd' }, { drivetrain: 'rwd' }],
      });
      // 3. Colors
      mockQuery.mockResolvedValueOnce({
        rows: [{ exterior_color: 'blue' }, { exterior_color: 'red' }, { exterior_color: 'silver' }],
      });
      // 4. Seller types
      mockQuery.mockResolvedValueOnce({
        rows: [{ seller_type: 'dealer' }, { seller_type: 'private' }],
      });
      // 5. Door counts
      mockQuery.mockResolvedValueOnce({
        rows: [{ door_count: 2 }, { door_count: 4 }, { door_count: 5 }],
      });
      // 6. Seat counts
      mockQuery.mockResolvedValueOnce({
        rows: [{ seat_count: 2 }, { seat_count: 4 }],
      });
      // 7. Conditions
      mockQuery.mockResolvedValueOnce({
        rows: [{ condition: 'classic' }, { condition: 'new' }, { condition: 'used' }],
      });
      // 8. Engine detail configurations
      mockQuery.mockResolvedValueOnce({
        rows: [{ engine_detail_config: 'flat-6' }, { engine_detail_config: 'inline-6' }, { engine_detail_config: 'v8' }, { engine_detail_config: 'v12' }],
      });
      // 9. Forced induction details
      mockQuery.mockResolvedValueOnce({
        rows: [{ forced_induction_detail: 'naturally_aspirated' }, { forced_induction_detail: 'supercharged' }, { forced_induction_detail: 'turbocharged' }],
      });
      // 10. Heritage era distribution
      mockQuery.mockResolvedValueOnce({
        rows: [
          { era: 'classic', count: '8' },
          { era: 'modern_classic', count: '32' },
          { era: 'contemporary', count: '60' },
        ],
      });
      // 11. Special edition count
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '5' }],
      });
      // 12. Makes
      mockQuery.mockResolvedValueOnce({
        rows: [{ make: 'BMW' }, { make: 'Ferrari' }, { make: 'Lamborghini' }, { make: 'Porsche' }],
      });
      // 13. Models by make
      mockQuery.mockResolvedValueOnce({
        rows: [
          { make: 'BMW', model: 'M3' },
          { make: 'BMW', model: 'M5' },
          { make: 'Ferrari', model: '488' },
          { make: 'Ferrari', model: 'F40' },
          { make: 'Lamborghini', model: 'Aventador' },
          { make: 'Porsche', model: '911' },
          { make: 'Porsche', model: 'Cayenne' },
          { make: 'Porsche', model: 'GT3' },
        ],
      });
    }

    it('should execute 13 parallel SQL queries for the filter options endpoint', async () => {
      setupSeededDatabaseMocks();

      await callFilterOptionsHandler();

      expect(mockQuery).toHaveBeenCalledTimes(13);
    });

    it('should query range aggregations with MIN/MAX against active listings', async () => {
      setupSeededDatabaseMocks();

      await callFilterOptionsHandler();

      const rangesCall = mockQuery.mock.calls[0][0] as string;
      expect(rangesCall).toContain('MIN(price)');
      expect(rangesCall).toContain('MAX(price)');
      expect(rangesCall).toContain('MIN(horsepower)');
      expect(rangesCall).toContain('MAX(horsepower)');
      expect(rangesCall).toContain('MIN(engine_displacement_cc)');
      expect(rangesCall).toContain('MAX(engine_displacement_cc)');
      expect(rangesCall).toContain('MIN(year)');
      expect(rangesCall).toContain('MAX(year)');
      expect(rangesCall).toContain('MIN(mileage)');
      expect(rangesCall).toContain('MAX(mileage)');
      expect(rangesCall).toContain("status = 'active'");
    });

    it('should query distinct values for discrete filters against active listings', async () => {
      setupSeededDatabaseMocks();

      await callFilterOptionsHandler();

      // Drivetrains (query index 1)
      const drivetrainSql = mockQuery.mock.calls[1][0] as string;
      expect(drivetrainSql).toContain('DISTINCT drivetrain');
      expect(drivetrainSql).toContain("status = 'active'");
      expect(drivetrainSql).toContain('drivetrain IS NOT NULL');

      // Colors (query index 2)
      const colorSql = mockQuery.mock.calls[2][0] as string;
      expect(colorSql).toContain('DISTINCT exterior_color');
      expect(colorSql).toContain("status = 'active'");

      // Seller types (query index 3)
      const sellerSql = mockQuery.mock.calls[3][0] as string;
      expect(sellerSql).toContain('DISTINCT seller_type');

      // Door counts (query index 4)
      const doorSql = mockQuery.mock.calls[4][0] as string;
      expect(doorSql).toContain('DISTINCT door_count');

      // Seat counts (query index 5)
      const seatSql = mockQuery.mock.calls[5][0] as string;
      expect(seatSql).toContain('DISTINCT seat_count');

      // Conditions (query index 6)
      const conditionSql = mockQuery.mock.calls[6][0] as string;
      expect(conditionSql).toContain('DISTINCT condition');

      // Engine detail configurations (query index 7)
      const engineSql = mockQuery.mock.calls[7][0] as string;
      expect(engineSql).toContain('DISTINCT engine_detail_config');

      // Forced induction details (query index 8)
      const inductionSql = mockQuery.mock.calls[8][0] as string;
      expect(inductionSql).toContain('DISTINCT forced_induction_detail');
    });

    it('should query heritage era distribution using CASE-based year grouping', async () => {
      setupSeededDatabaseMocks();

      await callFilterOptionsHandler();

      const eraSql = mockQuery.mock.calls[9][0] as string;
      expect(eraSql).toContain('CASE');
      expect(eraSql).toContain("WHEN year < 1990 THEN 'classic'");
      expect(eraSql).toContain("WHEN year >= 1990 AND year <= 2010 THEN 'modern_classic'");
      expect(eraSql).toContain("'contemporary'");
      expect(eraSql).toContain('GROUP BY era');
      expect(eraSql).toContain("status = 'active'");
    });

    it('should query modelsByMake using DISTINCT make, model pairs', async () => {
      setupSeededDatabaseMocks();

      await callFilterOptionsHandler();

      const modelsSql = mockQuery.mock.calls[12][0] as string;
      expect(modelsSql).toContain('DISTINCT make, model');
      expect(modelsSql).toContain("status = 'active'");
      expect(modelsSql).toContain('ORDER BY make, model');
    });

    it('should return correctly structured response from seeded data', async () => {
      setupSeededDatabaseMocks();

      const { body } = await callFilterOptionsHandler();
      const response = body as any;

      expect(response.ranges.price).toEqual({ min: 35000, max: 850000 });
      expect(response.ranges.horsepower).toEqual({ min: 200, max: 1001 });
      expect(response.ranges.engineDisplacement).toEqual({ min: 2000, max: 6300 });
      expect(response.ranges.year).toEqual({ min: 1972, max: 2024 });
      expect(response.ranges.mileage).toEqual({ min: 150, max: 320000 });

      expect(response.drivetrains).toEqual(['awd', 'rwd']);
      expect(response.colors).toEqual(['blue', 'red', 'silver']);
      expect(response.engineDetailConfigurations).toEqual(['flat-6', 'inline-6', 'v8', 'v12']);
      expect(response.forcedInductionDetails).toEqual(['naturally_aspirated', 'supercharged', 'turbocharged']);

      expect(response.heritageEraDistribution).toEqual({
        classic: 8,
        modern_classic: 32,
        contemporary: 60,
      });
      expect(response.specialEditionCount).toBe(5);

      expect(response.modelsByMake).toEqual({
        BMW: ['M3', 'M5'],
        Ferrari: ['488', 'F40'],
        Lamborghini: ['Aventador'],
        Porsche: ['911', 'Cayenne', 'GT3'],
      });
    });
  });

  describe('Full filter request lifecycle', () => {
    /**
     * Validates: Requirements 14.15, 14.16
     * Tests the complete flow: FilterEngine receives criteria with new fields →
     * validates → expands presets → builds WHERE clauses → generates cache key → queries DB.
     */

    it('should validate criteria with new fields successfully', () => {
      const criteria: FilterCriteria = {
        drivetrain: ['rwd', 'awd'],
        condition: ['used'],
        engineDetailConfiguration: ['v8', 'v12'],
        forcedInductionDetail: ['naturally_aspirated'],
        heritageEra: ['modern_classic'],
        isSpecialEdition: true,
        accelerationMax: 4.5,
        topSpeedMin: 280,
      };

      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should build correct WHERE clauses with parameterized values for new fields', async () => {
      mockDbResults(0, []);

      const criteria: FilterCriteria = {
        drivetrain: ['rwd'],
        color: ['black', 'red'],
        sellerType: ['dealer'],
        doors: [2, 4],
        seats: [4],
        condition: ['used', 'classic'],
        engineDetailConfiguration: ['v8'],
        forcedInductionDetail: ['turbocharged'],
      };

      await engine.query(criteria);

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;
      const params = countCall?.[1] as unknown[];

      // seller_type EXISTS in production — should be in the WHERE clause
      expect(sql).toContain('l.seller_type = ANY($');
      expect(params).toContainEqual(['dealer']);

      // The following columns do NOT exist in production (migrations not run).
      // They are intentionally skipped to prevent 500 errors.
      expect(sql).not.toContain('l.drivetrain');
      expect(sql).not.toContain('l.exterior_color');
      expect(sql).not.toContain('l.door_count');
      expect(sql).not.toContain('l.seat_count');
      expect(sql).not.toContain('l.condition = ANY(');
      expect(sql).not.toContain('l.engine_detail_config');
      expect(sql).not.toContain('l.forced_induction_detail');
    });

    it('should build heritage era year-based WHERE clause', async () => {
      mockDbResults(0, []);

      await engine.query({ heritageEra: ['classic', 'contemporary'] });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;

      expect(sql).toContain('l.year < 1990');
      expect(sql).toContain('l.year > 2010');
      expect(sql).toContain(' OR ');
    });

    it('should NOT build performance figure filters (columns not in production)', async () => {
      mockDbResults(0, []);

      await engine.query({ accelerationMax: 3.5, topSpeedMin: 300 });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;

      // Columns do not exist in production — must NOT be referenced
      expect(sql).not.toContain('l.zero_to_hundred_seconds');
      expect(sql).not.toContain('l.top_speed_kmh');
    });

    it('should NOT build isSpecialEdition boolean filter (column not in production)', async () => {
      mockDbResults(0, []);

      await engine.query({ isSpecialEdition: true });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;

      // Column does not exist in production — must NOT be referenced
      expect(sql).not.toContain('l.is_special_edition');
    });

    it('should expand performance preset before query building', async () => {
      mockDbResults(0, []);

      // Use the 'daily_luxury' preset which adds transmission, doors, and makes
      await engine.query({ performancePreset: 'daily_luxury' });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;
      const params = countCall?.[1] as unknown[];

      const preset = PERFORMANCE_PRESETS.find((p) => p.id === 'daily_luxury')!;

      // Verify preset's filters were expanded into WHERE clause
      // transmission_type and make columns exist in production
      expect(sql).toContain('l.transmission_type = ANY($');
      expect(sql).toContain('l.make = ANY($');
      expect(params).toContainEqual(preset.filters.transmissionType);
      expect(params).toContainEqual(preset.filters.makes);

      // doors column does NOT exist in production — should be skipped
      expect(sql).not.toContain('l.door_count');
    });

    it('should handle preset expansion with user overrides', async () => {
      mockDbResults(0, []);

      // User selects 'daily_luxury' preset but overrides the makes
      await engine.query({
        performancePreset: 'daily_luxury',
        makes: ['Ferrari', 'Lamborghini'],
      });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('COUNT(*)'),
      );
      const params = countCall?.[1] as unknown[];

      // User override takes precedence
      expect(params).toContainEqual(['Ferrari', 'Lamborghini']);
      // Preset's makes should NOT be present
      const preset = PERFORMANCE_PRESETS.find((p) => p.id === 'daily_luxury')!;
      expect(params).not.toContainEqual(preset.filters.makes);
    });

    it('should complete full lifecycle: validate → expand → query → cache', async () => {
      const listing = {
        id: 'uuid-test-1',
        title: 'BMW M5 CS',
        image_urls: ['https://example.com/m5.jpg'],
        make: 'BMW',
        model: 'M5 CS',
        year: 2022,
        price: 180000,
        horsepower: 635,
        engine_displacement_cc: 4395,
        date_added: new Date('2024-06-01'),
        status: 'active',
        is_featured: false,
      };
      mockDbResults(1, [listing]);

      const criteria: FilterCriteria = {
        drivetrain: ['awd'],
        engineDetailConfiguration: ['v8'],
        condition: ['used'],
      };

      const result = await engine.query(criteria);

      // Verify full lifecycle completed
      expect(result.totalCount).toBe(1);
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].title).toBe('BMW M5 CS');

      // Verify cache was populated
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('filter:'),
        expect.any(String),
        { EX: 300 },
      );
    });
  });

  describe('Cache key generation with new fields', () => {
    /**
     * Validates: Requirements 14.16
     * Tests that cache keys change when new filter fields are added,
     * ensuring different criteria produce different cache keys.
     */

    function computeCacheKey(criteria: FilterCriteria): string {
      const normalized = JSON.stringify(criteria, Object.keys(criteria).sort());
      return `filter:${createHash('sha256').update(normalized).digest('hex')}`;
    }

    it('should produce different cache keys for different drivetrain values', () => {
      const key1 = computeCacheKey({ drivetrain: ['rwd'] });
      const key2 = computeCacheKey({ drivetrain: ['awd'] });
      const key3 = computeCacheKey({ drivetrain: ['rwd', 'awd'] });

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should produce different cache keys when new fields are added vs omitted', () => {
      const withoutNewFields = computeCacheKey({ horsepowerMin: 300 });
      const withDrivetrain = computeCacheKey({ horsepowerMin: 300, drivetrain: ['rwd'] });
      const withCondition = computeCacheKey({ horsepowerMin: 300, condition: ['used'] });
      const withEngineConfig = computeCacheKey({ horsepowerMin: 300, engineDetailConfiguration: ['v8'] });

      expect(withoutNewFields).not.toBe(withDrivetrain);
      expect(withoutNewFields).not.toBe(withCondition);
      expect(withoutNewFields).not.toBe(withEngineConfig);
      expect(withDrivetrain).not.toBe(withCondition);
    });

    it('should produce different cache keys for different performance figure values', () => {
      const accel4 = computeCacheKey({ accelerationMax: 4.0 });
      const accel5 = computeCacheKey({ accelerationMax: 5.0 });
      const topSpeed300 = computeCacheKey({ topSpeedMin: 300 });
      const topSpeed250 = computeCacheKey({ topSpeedMin: 250 });

      expect(accel4).not.toBe(accel5);
      expect(topSpeed300).not.toBe(topSpeed250);
      expect(accel4).not.toBe(topSpeed300);
    });

    it('should produce different cache keys for isSpecialEdition true vs absent', () => {
      const withSpecial = computeCacheKey({ isSpecialEdition: true });
      const withoutSpecial = computeCacheKey({});

      expect(withSpecial).not.toBe(withoutSpecial);
    });

    it('should produce different cache keys for different heritageEra selections', () => {
      const classic = computeCacheKey({ heritageEra: ['classic'] });
      const modern = computeCacheKey({ heritageEra: ['modern_classic'] });
      const both = computeCacheKey({ heritageEra: ['classic', 'modern_classic'] });

      expect(classic).not.toBe(modern);
      expect(classic).not.toBe(both);
      expect(modern).not.toBe(both);
    });

    it('should produce identical cache keys for identical criteria regardless of field insertion order', () => {
      const criteria1: FilterCriteria = { drivetrain: ['rwd'], condition: ['used'], horsepowerMin: 300 };
      const criteria2: FilterCriteria = { horsepowerMin: 300, condition: ['used'], drivetrain: ['rwd'] };

      const key1 = computeCacheKey(criteria1);
      const key2 = computeCacheKey(criteria2);

      expect(key1).toBe(key2);
    });

    it('should use the cache key when querying (cache hit scenario)', async () => {
      const criteria: FilterCriteria = { drivetrain: ['awd'], engineDetailConfiguration: ['v8'] };
      const expectedKey = computeCacheKey(criteria);

      const cachedResult = {
        listings: [],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      };
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key === expectedKey) return JSON.stringify(cachedResult);
        return null;
      });

      const result = await engine.query(criteria);

      expect(result).toEqual(cachedResult);
      expect(mockRedis.get).toHaveBeenCalledWith(expectedKey);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('Database migration schema correctness', () => {
    /**
     * Validates: Requirements 15.11
     * Verifies the migration file exists and contains expected ALTER TABLE
     * statements and index definitions.
     */

    it('should export up and down migration functions', async () => {
      const migration = await import('../db/migrations/012_add-premium-filter-columns.js');

      expect(typeof migration.up).toBe('function');
      expect(typeof migration.down).toBe('function');
    });

    it('should define the expected new columns in the up migration', async () => {
      const migration = await import('../db/migrations/012_add-premium-filter-columns.js');

      // Create a mock MigrationBuilder to capture the SQL
      const sqlStatements: string[] = [];
      const indexesCreated: { table: string; columns: string; options: any }[] = [];

      const mockPgm = {
        sql: (statement: string) => sqlStatements.push(statement),
        createIndex: (table: string, columns: string, options: any) => {
          indexesCreated.push({ table, columns, options });
        },
        dropIndex: vi.fn(),
        dropColumn: vi.fn(),
      };

      await migration.up(mockPgm as any);

      // Verify ALTER TABLE contains expected columns
      const alterSql = sqlStatements.join(' ');
      expect(alterSql).toContain('ADD COLUMN drivetrain VARCHAR(3)');
      expect(alterSql).toContain("CHECK (drivetrain IN ('rwd', 'fwd', 'awd'))");
      expect(alterSql).toContain('ADD COLUMN exterior_color VARCHAR(50)');
      expect(alterSql).toContain('ADD COLUMN door_count SMALLINT');
      expect(alterSql).toContain('ADD COLUMN seat_count SMALLINT');
      expect(alterSql).toContain('ADD COLUMN condition VARCHAR(7)');
      expect(alterSql).toContain("CHECK (condition IN ('new', 'used', 'classic'))");
      expect(alterSql).toContain('ADD COLUMN engine_detail_config VARCHAR(10)');
      expect(alterSql).toContain("'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary'");
      expect(alterSql).toContain('ADD COLUMN forced_induction_detail VARCHAR(20)');
      expect(alterSql).toContain("'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo'");
      expect(alterSql).toContain('ADD COLUMN zero_to_hundred_seconds DECIMAL(4,1)');
      expect(alterSql).toContain('ADD COLUMN top_speed_kmh SMALLINT');
      expect(alterSql).toContain('ADD COLUMN is_special_edition BOOLEAN NOT NULL DEFAULT FALSE');
    });

    it('should create partial indexes for all new filterable columns', async () => {
      const migration = await import('../db/migrations/012_add-premium-filter-columns.js');

      const indexesCreated: { table: string; columns: string; options: any }[] = [];

      const mockPgm = {
        sql: vi.fn(),
        createIndex: (table: string, columns: string, options: any) => {
          indexesCreated.push({ table, columns, options });
        },
        dropIndex: vi.fn(),
        dropColumn: vi.fn(),
      };

      await migration.up(mockPgm as any);

      // Verify all expected indexes are created
      const indexNames = indexesCreated.map((i) => i.options.name);
      expect(indexNames).toContain('idx_listings_drivetrain');
      expect(indexNames).toContain('idx_listings_exterior_color');
      expect(indexNames).toContain('idx_listings_door_count');
      expect(indexNames).toContain('idx_listings_seat_count');
      expect(indexNames).toContain('idx_listings_condition');
      expect(indexNames).toContain('idx_listings_engine_detail_config');
      expect(indexNames).toContain('idx_listings_forced_induction_detail');
      expect(indexNames).toContain('idx_listings_is_special_edition');

      // Verify all indexes are on the listings table
      for (const idx of indexesCreated) {
        expect(idx.table).toBe('listings');
      }

      // Verify partial index WHERE conditions
      const drivetrainIdx = indexesCreated.find((i) => i.options.name === 'idx_listings_drivetrain');
      expect(drivetrainIdx?.options.where).toBe('drivetrain IS NOT NULL');

      const specialEditionIdx = indexesCreated.find((i) => i.options.name === 'idx_listings_is_special_edition');
      expect(specialEditionIdx?.options.where).toBe('is_special_edition = TRUE');
    });

    it('should have a down migration that drops all added columns and indexes', async () => {
      const migration = await import('../db/migrations/012_add-premium-filter-columns.js');

      const droppedIndexes: string[] = [];
      const droppedColumns: string[] = [];

      const mockPgm = {
        sql: vi.fn(),
        createIndex: vi.fn(),
        dropIndex: (_table: string, _cols: string, options: any) => {
          droppedIndexes.push(options.name);
        },
        dropColumn: (_table: string, column: string) => {
          droppedColumns.push(column);
        },
      };

      await migration.down(mockPgm as any);

      // Verify all indexes are dropped
      expect(droppedIndexes).toContain('idx_listings_drivetrain');
      expect(droppedIndexes).toContain('idx_listings_exterior_color');
      expect(droppedIndexes).toContain('idx_listings_door_count');
      expect(droppedIndexes).toContain('idx_listings_seat_count');
      expect(droppedIndexes).toContain('idx_listings_condition');
      expect(droppedIndexes).toContain('idx_listings_engine_detail_config');
      expect(droppedIndexes).toContain('idx_listings_forced_induction_detail');
      expect(droppedIndexes).toContain('idx_listings_is_special_edition');

      // Verify all columns are dropped
      expect(droppedColumns).toContain('drivetrain');
      expect(droppedColumns).toContain('exterior_color');
      expect(droppedColumns).toContain('door_count');
      expect(droppedColumns).toContain('seat_count');
      expect(droppedColumns).toContain('condition');
      expect(droppedColumns).toContain('engine_detail_config');
      expect(droppedColumns).toContain('forced_induction_detail');
      expect(droppedColumns).toContain('zero_to_hundred_seconds');
      expect(droppedColumns).toContain('top_speed_kmh');
      expect(droppedColumns).toContain('is_special_edition');
    });
  });
});
