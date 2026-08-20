import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterEngine } from './filter-engine.js';
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

const sampleListingRow = {
  id: 'uuid-1',
  title: 'Ferrari 488 GTB',
  image_urls: ['https://example.com/img1.jpg'],
  make: 'Ferrari',
  model: '488 GTB',
  year: 2020,
  price: 250000,
  horsepower: 670,
  engine_displacement_cc: 3902,
  date_added: new Date('2024-01-15'),
};

describe('FilterEngine', () => {
  let engine: FilterEngine;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    mockRedis = createMockRedis();
    mockGetRedisClient.mockReturnValue(mockRedis as any);
  });

  describe('validateCriteria()', () => {
    it('should return valid for empty criteria', () => {
      const result = engine.validateCriteria({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for correct range filters', () => {
      const criteria: FilterCriteria = {
        engineDisplacementMin: 2000,
        engineDisplacementMax: 5000,
        horsepowerMin: 200,
        horsepowerMax: 800,
        yearMin: 2000,
        yearMax: 2024,
        priceMin: 50000,
        priceMax: 500000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid engine displacement range (min > max)', () => {
      const criteria: FilterCriteria = {
        engineDisplacementMin: 5000,
        engineDisplacementMax: 2000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'engineDisplacement',
        message: 'Minimum engine displacement must not exceed maximum',
      });
    });

    it('should detect invalid horsepower range (min > max)', () => {
      const criteria: FilterCriteria = {
        horsepowerMin: 800,
        horsepowerMax: 200,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'horsepower',
        message: 'Minimum horsepower must not exceed maximum',
      });
    });

    it('should detect invalid year range (min > max)', () => {
      const criteria: FilterCriteria = {
        yearMin: 2024,
        yearMax: 2000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'year',
        message: 'Minimum year must not exceed maximum',
      });
    });

    it('should detect invalid price range (min > max)', () => {
      const criteria: FilterCriteria = {
        priceMin: 500000,
        priceMax: 50000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Minimum price must not exceed maximum',
      });
    });

    it('should allow min equal to max', () => {
      const criteria: FilterCriteria = {
        horsepowerMin: 500,
        horsepowerMax: 500,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(true);
    });

    it('should detect displacement below minimum bound', () => {
      const criteria: FilterCriteria = {
        engineDisplacementMin: -100,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('engineDisplacementMin');
    });

    it('should detect displacement above maximum bound', () => {
      const criteria: FilterCriteria = {
        engineDisplacementMax: 15000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('engineDisplacementMax');
    });

    it('should detect horsepower below minimum bound', () => {
      const criteria: FilterCriteria = {
        horsepowerMin: -50,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('horsepowerMin');
    });

    it('should detect horsepower above maximum bound', () => {
      const criteria: FilterCriteria = {
        horsepowerMax: 3000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('horsepowerMax');
    });

    it('should detect year below minimum bound', () => {
      const criteria: FilterCriteria = {
        yearMin: 1900,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('yearMin');
    });

    it('should detect year above maximum bound (current year)', () => {
      const criteria: FilterCriteria = {
        yearMax: new Date().getFullYear() + 5,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('yearMax');
    });

    it('should detect price below minimum bound', () => {
      const criteria: FilterCriteria = {
        priceMin: -1000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('priceMin');
    });

    it('should detect price above maximum bound', () => {
      const criteria: FilterCriteria = {
        priceMax: 60_000_000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('priceMax');
    });

    it('should report multiple errors simultaneously', () => {
      const criteria: FilterCriteria = {
        horsepowerMin: 800,
        horsepowerMax: 200,
        priceMin: 500000,
        priceMax: 50000,
      };
      const result = engine.validateCriteria(criteria);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('query()', () => {
    it('should return paginated results with defaults', async () => {
      mockDbResults(1, [sampleListingRow]);

      const result = await engine.query({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].id).toBe('uuid-1');
      expect(result.listings[0].title).toBe('Ferrari 488 GTB');
      expect(result.listings[0].primaryImageUrl).toBe('https://example.com/img1.jpg');
    });

    it('should use custom page and pageSize', async () => {
      mockDbResults(100, []);

      const result = await engine.query({ page: 3, pageSize: 20 });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(5);

      // Check that OFFSET is correctly calculated
      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[1]).toContainEqual(40); // offset = (3-1) * 20
    });

    it('should default sort to date_added DESC', async () => {
      mockDbResults(0, []);

      await engine.query({});

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[0]).toContain('l.date_added DESC');
    });

    it('should apply sort by price ascending', async () => {
      mockDbResults(0, []);

      await engine.query({ sortBy: 'price', sortOrder: 'asc' });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[0]).toContain('l.price ASC');
    });

    it('should apply sort by horsepower descending', async () => {
      mockDbResults(0, []);

      await engine.query({ sortBy: 'horsepower', sortOrder: 'desc' });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[0]).toContain('l.horsepower DESC');
    });

    it('should apply sort by engineDisplacement', async () => {
      mockDbResults(0, []);

      await engine.query({ sortBy: 'engineDisplacement', sortOrder: 'asc' });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[0]).toContain('l.engine_displacement_cc ASC');
    });

    it('should build WHERE clause for engine displacement range', async () => {
      mockDbResults(0, []);

      await engine.query({ engineDisplacementMin: 3000, engineDisplacementMax: 6000 });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.engine_displacement_cc >= $1');
      expect(countCall?.[0]).toContain('l.engine_displacement_cc <= $2');
      expect(countCall?.[1]).toContainEqual(3000);
      expect(countCall?.[1]).toContainEqual(6000);
    });

    it('should build WHERE clause for horsepower range', async () => {
      mockDbResults(0, []);

      await engine.query({ horsepowerMin: 300, horsepowerMax: 800 });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.horsepower >= $1');
      expect(countCall?.[0]).toContain('l.horsepower <= $2');
    });

    it('should build WHERE clause for year range', async () => {
      mockDbResults(0, []);

      await engine.query({ yearMin: 2010, yearMax: 2022 });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.year >= $1');
      expect(countCall?.[0]).toContain('l.year <= $2');
    });

    it('should build WHERE clause for price range', async () => {
      mockDbResults(0, []);

      await engine.query({ priceMin: 50000, priceMax: 200000 });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.price >= $1');
      expect(countCall?.[0]).toContain('l.price <= $2');
    });

    it('should build WHERE clause for transmission type', async () => {
      mockDbResults(0, []);

      await engine.query({ transmissionType: ['manual', 'automatic'] });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.transmission_type = ANY($1)');
      expect(countCall?.[1]).toContainEqual(['manual', 'automatic']);
    });

    it('should build WHERE clause for fuel type', async () => {
      mockDbResults(0, []);

      await engine.query({ fuelType: ['petrol', 'diesel'] });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.fuel_type = ANY($1)');
      expect(countCall?.[1]).toContainEqual(['petrol', 'diesel']);
    });

    it('should JOIN sound_profiles when sound filters are applied', async () => {
      mockDbResults(0, []);

      await engine.query({
        soundProfile: {
          engineConfiguration: ['v-type'],
        },
      });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id');
      expect(countCall?.[0]).toContain('l.sound_profile_id IS NOT NULL');
      expect(countCall?.[0]).toContain('sp.engine_configuration = ANY($1)');
    });

    it('should apply all sound profile filters', async () => {
      mockDbResults(0, []);

      await engine.query({
        soundProfile: {
          engineConfiguration: ['v-type'],
          cylinderCount: [8, 12],
          forcedInduction: ['naturally_aspirated'],
          exhaustNote: ['deep_rumble'],
        },
      });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('sp.engine_configuration = ANY(');
      expect(countCall?.[0]).toContain('sp.cylinder_count = ANY(');
      expect(countCall?.[0]).toContain('sp.forced_induction = ANY(');
      expect(countCall?.[0]).toContain('sp.exhaust_note = ANY(');
    });

    it('should NOT join sound_profiles when soundProfile is empty', async () => {
      mockDbResults(0, []);

      await engine.query({ soundProfile: {} });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).not.toContain('INNER JOIN sound_profiles');
    });

    it('should exclude unclassified sound profiles when sound filters are active', async () => {
      mockDbResults(0, []);

      await engine.query({
        soundProfile: { exhaustNote: ['deep_rumble'] },
      });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.sound_profile_id IS NOT NULL');
    });

    it('should only filter active listings', async () => {
      mockDbResults(0, []);

      await engine.query({});

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain("l.status = 'active'");
    });

    it('should include sold listings when showSold is true', async () => {
      mockDbResults(0, []);

      await engine.query({ showSold: true });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain("l.status IN ('active', 'sold')");
      expect(countCall?.[0]).not.toContain("l.status = 'active'");
    });

    it('should never include stale listings even when showSold is true', async () => {
      mockDbResults(0, []);

      await engine.query({ showSold: true });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).not.toContain('stale');
    });

    it('should exclude sold listings when showSold is false', async () => {
      mockDbResults(0, []);

      await engine.query({ showSold: false });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain("l.status = 'active'");
    });

    it('should include status field in listing summary response', async () => {
      const rowWithStatus = { ...sampleListingRow, status: 'sold' as const };
      mockDbResults(1, [rowWithStatus]);

      const result = await engine.query({ showSold: true });

      expect(result.listings[0].status).toBe('sold');
    });

    it('should throw on invalid criteria', async () => {
      await expect(
        engine.query({ horsepowerMin: 800, horsepowerMax: 200 }),
      ).rejects.toThrow('Invalid filter criteria');
    });

    it('should return from cache when available', async () => {
      const cachedResult = {
        listings: [],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await engine.query({});

      expect(result).toEqual(cachedResult);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should cache results after a successful query', async () => {
      mockDbResults(0, []);

      await engine.query({});

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('filter:'),
        expect.any(String),
        { EX: 300 },
      );
    });

    it('should proceed gracefully when Redis get fails', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection lost'));
      mockDbResults(1, [sampleListingRow]);

      const result = await engine.query({});

      expect(result.totalCount).toBe(1);
      expect(result.listings).toHaveLength(1);
    });

    it('should proceed gracefully when Redis set fails', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection lost'));
      mockDbResults(1, [sampleListingRow]);

      const result = await engine.query({});

      expect(result.totalCount).toBe(1);
    });

    it('should handle listing with no images', async () => {
      const rowNoImages = { ...sampleListingRow, image_urls: [] };
      mockDbResults(1, [rowNoImages]);

      const result = await engine.query({});

      expect(result.listings[0].primaryImageUrl).toBeNull();
    });

    it('should handle null image_urls', async () => {
      const rowNullImages = { ...sampleListingRow, image_urls: null };
      mockDbResults(1, [rowNullImages]);

      const result = await engine.query({});

      expect(result.listings[0].primaryImageUrl).toBeNull();
    });

    it('should combine multiple filter types correctly (AND conjunction)', async () => {
      mockDbResults(0, []);

      await engine.query({
        horsepowerMin: 400,
        priceMax: 300000,
        transmissionType: ['manual'],
        fuelType: ['petrol'],
      });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;
      expect(sql).toContain("l.status = 'active'");
      expect(sql).toContain('l.horsepower >= $1');
      expect(sql).toContain('l.price <= $2');
      expect(sql).toContain('l.transmission_type = ANY($3)');
      expect(sql).toContain('l.fuel_type = ANY($4)');
      // All joined with AND
      expect(sql.split(' AND ').length).toBeGreaterThanOrEqual(5);
    });

    it('should calculate totalPages correctly', async () => {
      mockDbResults(103, []);

      const result = await engine.query({ pageSize: 20 });

      expect(result.totalPages).toBe(6); // ceil(103/20) = 6
    });

    it('should calculate totalPages as 0 when no results', async () => {
      mockDbResults(0, []);

      const result = await engine.query({});

      expect(result.totalPages).toBe(0);
    });
  });

  describe('queryCursor()', () => {
    it('should return items with nextCursor when more results exist', async () => {
      // Return 4 items (limit+1) to indicate more pages
      const rows = [
        { ...sampleListingRow, id: 'uuid-1' },
        { ...sampleListingRow, id: 'uuid-2' },
        { ...sampleListingRow, id: 'uuid-3' },
        { ...sampleListingRow, id: 'uuid-4' },
      ];
      mockDbResults(10, rows);

      const result = await engine.queryCursor({ limit: 3, filters: {} });

      expect(result.items).toHaveLength(3);
      expect(result.nextCursor).not.toBeNull();
      expect(result.totalCount).toBe(10);
    });

    it('should return nextCursor as null when no more results', async () => {
      const rows = [
        { ...sampleListingRow, id: 'uuid-1' },
        { ...sampleListingRow, id: 'uuid-2' },
      ];
      mockDbResults(2, rows);

      const result = await engine.queryCursor({ limit: 3, filters: {} });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(result.totalCount).toBe(2);
    });

    it('should start at offset 0 when no cursor is provided', async () => {
      mockDbResults(0, []);

      await engine.queryCursor({ limit: 10, filters: {} });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      // Last param is offset, should be 0
      const params = dataCall?.[1] as unknown[];
      expect(params[params.length - 1]).toBe(0);
    });

    it('should decode cursor to get offset position', async () => {
      mockDbResults(0, []);
      const cursor = Buffer.from('20').toString('base64'); // offset 20

      await engine.queryCursor({ cursor, limit: 10, filters: {} });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      const params = dataCall?.[1] as unknown[];
      expect(params[params.length - 1]).toBe(20);
    });

    it('should encode nextCursor as base64 of offset + limit', async () => {
      // 4 rows returned means hasMore=true for limit=3
      const rows = Array.from({ length: 4 }, (_, i) => ({
        ...sampleListingRow,
        id: `uuid-${i}`,
      }));
      mockDbResults(50, rows);

      const result = await engine.queryCursor({ limit: 3, filters: {} });

      // nextCursor should encode offset 0 + limit 3 = 3
      const decoded = Buffer.from(result.nextCursor!, 'base64').toString('utf8');
      expect(decoded).toBe('3');
    });

    it('should fetch limit+1 items to determine hasMore', async () => {
      mockDbResults(10, []);

      await engine.queryCursor({ limit: 5, filters: {} });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      const params = dataCall?.[1] as unknown[];
      // fetchCount should be limit+1 = 6
      expect(params[params.length - 2]).toBe(6);
    });

    it('should throw on invalid cursor', async () => {
      await expect(
        engine.queryCursor({ cursor: '!!!invalid!!!', limit: 10, filters: {} }),
      ).rejects.toThrow('Invalid cursor');
    });

    it('should throw on invalid filter criteria', async () => {
      await expect(
        engine.queryCursor({ limit: 10, filters: { horsepowerMin: 800, horsepowerMax: 200 } }),
      ).rejects.toThrow('Invalid filter criteria');
    });

    it('should use default sort (dateAdded DESC) when no sort specified', async () => {
      mockDbResults(0, []);

      await engine.queryCursor({ limit: 10, filters: {} });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[0]).toContain('l.date_added DESC');
    });

    it('should apply custom sort from params', async () => {
      mockDbResults(0, []);

      await engine.queryCursor({ limit: 10, filters: {}, sort: { field: 'price', order: 'asc' } });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      expect(dataCall?.[0]).toContain('l.price ASC');
    });

    it('should apply filters from criteria', async () => {
      mockDbResults(0, []);

      await engine.queryCursor({ limit: 10, filters: { makes: ['Ferrari', 'Porsche'] } });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain('l.make = ANY($1)');
    });

    it('should include sold listings when showSold is true in cursor mode', async () => {
      mockDbResults(0, []);

      await engine.queryCursor({ limit: 10, filters: { showSold: true } });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      expect(countCall?.[0]).toContain("l.status IN ('active', 'sold')");
    });

    it('should include status field in cursor mode response', async () => {
      const rowWithStatus = { ...sampleListingRow, status: 'active' as const };
      mockDbResults(1, [rowWithStatus]);

      const result = await engine.queryCursor({ limit: 10, filters: {} });

      expect(result.items[0].status).toBe('active');
    });

    it('should map listing rows to ListingSummary correctly', async () => {
      mockDbResults(1, [{ ...sampleListingRow, status: 'active', is_featured: false }]);

      const result = await engine.queryCursor({ limit: 10, filters: {} });

      expect(result.items[0]).toEqual({
        id: 'uuid-1',
        title: 'Ferrari 488 GTB',
        primaryImageUrl: 'https://example.com/img1.jpg',
        make: 'Ferrari',
        model: '488 GTB',
        year: 2020,
        price: 250000,
        horsepower: 670,
        engineDisplacementCc: 3902,
        dateAdded: new Date('2024-01-15'),
        status: 'active',
        isFeatured: false,
      });
    });

    it('should chain cursors correctly across pages', async () => {
      // Page 1: returns 4 rows (limit+1), hasMore=true
      const page1Rows = Array.from({ length: 4 }, (_, i) => ({
        ...sampleListingRow,
        id: `uuid-${i}`,
      }));
      mockDbResults(10, page1Rows);

      const page1 = await engine.queryCursor({ limit: 3, filters: {} });
      expect(page1.nextCursor).not.toBeNull();

      // Decode cursor to verify offset
      const decoded = Buffer.from(page1.nextCursor!, 'base64').toString('utf8');
      expect(decoded).toBe('3');

      // Page 2 with cursor
      vi.clearAllMocks();
      mockGetRedisClient.mockReturnValue(null as any);
      const page2Rows = Array.from({ length: 2 }, (_, i) => ({
        ...sampleListingRow,
        id: `uuid-${i + 3}`,
      }));
      mockDbResults(10, page2Rows);

      const page2 = await engine.queryCursor({ cursor: page1.nextCursor!, limit: 3, filters: {} });
      expect(page2.items).toHaveLength(2);
      expect(page2.nextCursor).toBeNull(); // no more pages
    });
  });

  describe('Featured listing ordering', () => {
    it('should ORDER BY featured flag DESC before user sort in query()', async () => {
      mockDbResults(0, []);

      await engine.query({});

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      const sql = dataCall?.[0] as string;
      // Featured active listings should come first
      expect(sql).toContain("(l.is_featured = TRUE AND l.status = 'active') DESC");
      expect(sql).toContain('l.featured_sort_order ASC');
      // Verify featured ordering comes before user sort
      const featuredIdx = sql.indexOf("(l.is_featured = TRUE AND l.status = 'active') DESC");
      const sortOrderIdx = sql.indexOf('l.featured_sort_order ASC');
      const userSortIdx = sql.indexOf('l.date_added DESC');
      expect(featuredIdx).toBeLessThan(sortOrderIdx);
      expect(sortOrderIdx).toBeLessThan(userSortIdx);
    });

    it('should ORDER BY featured flag DESC before user sort in queryCursor()', async () => {
      mockDbResults(0, []);

      await engine.queryCursor({ limit: 10, filters: {}, sort: { field: 'price', order: 'asc' } });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      const sql = dataCall?.[0] as string;
      expect(sql).toContain("(l.is_featured = TRUE AND l.status = 'active') DESC");
      expect(sql).toContain('l.featured_sort_order ASC');
      // Featured ordering before user sort
      const featuredIdx = sql.indexOf("(l.is_featured = TRUE AND l.status = 'active') DESC");
      const userSortIdx = sql.indexOf('l.price ASC');
      expect(featuredIdx).toBeLessThan(userSortIdx);
    });

    it('should exclude sold listings from featured position via ORDER BY expression', async () => {
      mockDbResults(0, []);

      await engine.query({ showSold: true });

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      const sql = dataCall?.[0] as string;
      // The ORDER BY uses AND l.status = 'active' so sold listings won't be featured
      expect(sql).toContain("(l.is_featured = TRUE AND l.status = 'active') DESC");
    });

    it('should include is_featured in SELECT columns', async () => {
      mockDbResults(0, []);

      await engine.query({});

      const dataCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && !call[0].includes('COUNT(*)'),
      );
      const sql = dataCall?.[0] as string;
      expect(sql).toContain('l.is_featured');
    });

    it('should map is_featured field to isFeatured in query() response', async () => {
      mockDbResults(1, [{ ...sampleListingRow, status: 'active', is_featured: true }]);

      const result = await engine.query({});

      expect(result.listings[0].isFeatured).toBe(true);
    });

    it('should map is_featured field to isFeatured in queryCursor() response', async () => {
      mockDbResults(1, [{ ...sampleListingRow, status: 'active', is_featured: true }]);

      const result = await engine.queryCursor({ limit: 10, filters: {} });

      expect(result.items[0].isFeatured).toBe(true);
    });
  });

  describe('validateCriteria() - new filter fields', () => {
    // ─── Drivetrain validation ────────────────────────────────────────────

    it('should accept valid drivetrain values', () => {
      const result = engine.validateCriteria({ drivetrain: ['rwd', 'fwd', 'awd'] });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid drivetrain values', () => {
      const result = engine.validateCriteria({ drivetrain: ['rwd', '4wd' as any] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('drivetrain');
    });

    // ─── Condition validation ────────────────────────────────────────────

    it('should accept valid condition values', () => {
      const result = engine.validateCriteria({ condition: ['new', 'used', 'classic'] });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid condition values', () => {
      const result = engine.validateCriteria({ condition: ['new', 'broken' as any] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('condition');
    });

    // ─── Engine detail configuration validation ─────────────────────────

    it('should accept valid engineDetailConfiguration values', () => {
      const result = engine.validateCriteria({ engineDetailConfiguration: ['v8', 'inline-6', 'rotary'] });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid engineDetailConfiguration values', () => {
      const result = engine.validateCriteria({ engineDetailConfiguration: ['v8', 'v14' as any] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('engineDetailConfiguration');
    });

    // ─── Forced induction detail validation ──────────────────────────────

    it('should accept valid forcedInductionDetail values', () => {
      const result = engine.validateCriteria({ forcedInductionDetail: ['turbocharged', 'twin_turbo'] });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid forcedInductionDetail values', () => {
      const result = engine.validateCriteria({ forcedInductionDetail: ['quad_turbo' as any] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('forcedInductionDetail');
    });

    // ─── Heritage era validation ────────────────────────────────────────

    it('should accept valid heritageEra values', () => {
      const result = engine.validateCriteria({ heritageEra: ['classic', 'modern_classic', 'contemporary'] });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid heritageEra values', () => {
      const result = engine.validateCriteria({ heritageEra: ['future' as any] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('heritageEra');
    });

    // ─── Seller type validation ─────────────────────────────────────────

    it('should accept valid sellerType values', () => {
      const result = engine.validateCriteria({ sellerType: ['dealer', 'private'] });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid sellerType values', () => {
      const result = engine.validateCriteria({ sellerType: ['auction' as any] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('sellerType');
    });

    // ─── Doors validation ────────────────────────────────────────────────

    it('should accept valid doors values (positive integers)', () => {
      const result = engine.validateCriteria({ doors: [2, 3, 4, 5] });
      expect(result.valid).toBe(true);
    });

    it('should reject non-positive doors values', () => {
      const result = engine.validateCriteria({ doors: [2, 0] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('doors');
    });

    it('should reject non-integer doors values', () => {
      const result = engine.validateCriteria({ doors: [2.5] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('doors');
    });

    // ─── Seats validation ────────────────────────────────────────────────

    it('should accept valid seats values (positive integers)', () => {
      const result = engine.validateCriteria({ seats: [2, 4, 5, 7] });
      expect(result.valid).toBe(true);
    });

    it('should reject non-positive seats values', () => {
      const result = engine.validateCriteria({ seats: [-1] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('seats');
    });

    it('should reject non-integer seats values', () => {
      const result = engine.validateCriteria({ seats: [4.5] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('seats');
    });

    // ─── Acceleration max validation ─────────────────────────────────────

    it('should accept valid accelerationMax (positive number)', () => {
      const result = engine.validateCriteria({ accelerationMax: 3.5 });
      expect(result.valid).toBe(true);
    });

    it('should reject zero accelerationMax', () => {
      const result = engine.validateCriteria({ accelerationMax: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('accelerationMax');
    });

    it('should reject negative accelerationMax', () => {
      const result = engine.validateCriteria({ accelerationMax: -2 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('accelerationMax');
    });

    // ─── Top speed min validation ────────────────────────────────────────

    it('should accept valid topSpeedMin (positive number)', () => {
      const result = engine.validateCriteria({ topSpeedMin: 300 });
      expect(result.valid).toBe(true);
    });

    it('should reject zero topSpeedMin', () => {
      const result = engine.validateCriteria({ topSpeedMin: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('topSpeedMin');
    });

    it('should reject negative topSpeedMin', () => {
      const result = engine.validateCriteria({ topSpeedMin: -100 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('topSpeedMin');
    });

    // ─── isSpecialEdition validation ─────────────────────────────────────

    it('should accept boolean isSpecialEdition (true)', () => {
      const result = engine.validateCriteria({ isSpecialEdition: true });
      expect(result.valid).toBe(true);
    });

    it('should accept boolean isSpecialEdition (false)', () => {
      const result = engine.validateCriteria({ isSpecialEdition: false });
      expect(result.valid).toBe(true);
    });

    it('should reject non-boolean isSpecialEdition', () => {
      const result = engine.validateCriteria({ isSpecialEdition: 'yes' as any });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('isSpecialEdition');
    });

    // ─── Performance preset validation ───────────────────────────────────

    it('should accept valid performancePreset', () => {
      const result = engine.validateCriteria({ performancePreset: 'v8_grand_tourers' });
      expect(result.valid).toBe(true);
    });

    it('should accept null performancePreset', () => {
      const result = engine.validateCriteria({ performancePreset: null });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid performancePreset', () => {
      const result = engine.validateCriteria({ performancePreset: 'unknown_preset' as any });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('performancePreset');
    });

    // ─── Valid new fields pass together ──────────────────────────────────

    it('should accept all new filter fields with valid values simultaneously', () => {
      const result = engine.validateCriteria({
        drivetrain: ['rwd', 'awd'],
        condition: ['new', 'used'],
        engineDetailConfiguration: ['v8', 'v12'],
        forcedInductionDetail: ['turbocharged'],
        heritageEra: ['contemporary'],
        sellerType: ['dealer'],
        doors: [2, 4],
        seats: [2, 4],
        accelerationMax: 4.0,
        topSpeedMin: 250,
        isSpecialEdition: true,
        performancePreset: 'track_weapons',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // ─── Empty arrays pass ───────────────────────────────────────────────

    it('should accept empty arrays for multi-select fields', () => {
      const result = engine.validateCriteria({
        drivetrain: [],
        condition: [],
        engineDetailConfiguration: [],
        forcedInductionDetail: [],
        heritageEra: [],
        sellerType: [],
        doors: [],
        seats: [],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('expandPerformancePreset()', () => {
    it('should return criteria unchanged when no performancePreset is set', () => {
      const criteria: FilterCriteria = { horsepowerMin: 300, makes: ['Ferrari'] };
      const result = engine.expandPerformancePreset(criteria);
      expect(result).toEqual(criteria);
    });

    it('should return criteria unchanged when performancePreset is null', () => {
      const criteria: FilterCriteria = { performancePreset: null, horsepowerMin: 300 };
      const result = engine.expandPerformancePreset(criteria);
      expect(result).toEqual(criteria);
    });

    it('should expand v8_grand_tourers preset into compound filters', () => {
      const criteria: FilterCriteria = { performancePreset: 'v8_grand_tourers' };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.performancePreset).toBeUndefined();
      expect(result.bodyType).toEqual(['coupe', 'cabriolet']);
      expect(result.horsepowerMin).toBe(400);
      expect(result.soundProfile?.cylinderCount).toEqual([8, 10, 12]);
    });

    it('should expand track_weapons preset into compound filters', () => {
      const criteria: FilterCriteria = { performancePreset: 'track_weapons' };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.performancePreset).toBeUndefined();
      expect(result.horsepowerMin).toBe(500);
      expect(result.transmissionType).toEqual(['manual', 'automatic']);
      expect(result.bodyType).toEqual(['coupe']);
    });

    it('should expand daily_luxury preset into compound filters', () => {
      const criteria: FilterCriteria = { performancePreset: 'daily_luxury' };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.performancePreset).toBeUndefined();
      expect(result.transmissionType).toEqual(['automatic']);
      expect(result.doors).toEqual([4, 5]);
      expect(result.makes).toContain('BMW');
      expect(result.makes).toContain('Porsche');
    });

    it('should expand classic_collectibles preset into compound filters', () => {
      const criteria: FilterCriteria = { performancePreset: 'classic_collectibles' };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.performancePreset).toBeUndefined();
      expect(result.yearMax).toBe(2000);
      expect(result.isSpecialEdition).toBe(true);
      expect(result.mileageMax).toBe(100000);
    });

    it('should give user-supplied values precedence over preset defaults', () => {
      const criteria: FilterCriteria = {
        performancePreset: 'track_weapons',
        horsepowerMin: 600, // User overrides preset's 500
      };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.horsepowerMin).toBe(600);
      // Preset's bodyType should still apply since user didn't provide it
      expect(result.bodyType).toEqual(['coupe']);
    });

    it('should give user-supplied array values precedence over preset arrays', () => {
      const criteria: FilterCriteria = {
        performancePreset: 'daily_luxury',
        makes: ['Porsche'], // User overrides preset's makes list
      };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.makes).toEqual(['Porsche']);
      // Other preset values should still apply
      expect(result.transmissionType).toEqual(['automatic']);
    });

    it('should strip the performancePreset field from the result', () => {
      const criteria: FilterCriteria = { performancePreset: 'v8_grand_tourers' };
      const result = engine.expandPerformancePreset(criteria);

      expect('performancePreset' in result).toBe(false);
    });

    it('should strip an unknown preset and return criteria without it', () => {
      const criteria: FilterCriteria = {
        performancePreset: 'nonexistent_preset' as any,
        horsepowerMin: 300,
      };
      const result = engine.expandPerformancePreset(criteria);

      expect('performancePreset' in result).toBe(false);
      expect(result.horsepowerMin).toBe(300);
    });

    it('should merge soundProfile from preset when user has no soundProfile', () => {
      const criteria: FilterCriteria = { performancePreset: 'v8_grand_tourers' };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.soundProfile?.cylinderCount).toEqual([8, 10, 12]);
    });

    it('should let user soundProfile fields override preset soundProfile fields', () => {
      const criteria: FilterCriteria = {
        performancePreset: 'v8_grand_tourers',
        soundProfile: { cylinderCount: [12] }, // User overrides
      };
      const result = engine.expandPerformancePreset(criteria);

      expect(result.soundProfile?.cylinderCount).toEqual([12]);
    });
  });

  describe('query() with performance preset expansion', () => {
    it('should expand preset before building WHERE clause', async () => {
      mockDbResults(0, []);

      await engine.query({ performancePreset: 'track_weapons' });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;
      // track_weapons expands to horsepowerMin: 500, bodyType: ['coupe'], transmissionType: ['manual', 'automatic']
      expect(sql).toContain('l.horsepower >= ');
      expect(sql).toContain('l.body_type = ANY(');
      expect(sql).toContain('l.transmission_type = ANY(');
    });

    it('should not include performancePreset as a raw column filter', async () => {
      mockDbResults(0, []);

      await engine.query({ performancePreset: 'daily_luxury' });

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT(*)'),
      );
      const sql = countCall?.[0] as string;
      expect(sql).not.toContain('performance_preset');
      expect(sql).not.toContain('performancePreset');
    });
  });
});
