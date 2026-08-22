import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { DEFAULT_RANGES } from '@car-ads/shared';
import type { FilterOptionsResponse } from '@car-ads/shared';

// Mock the database connection module
const mockQuery = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Mock the Redis cache module
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockGetRedisClient = vi.fn();
vi.mock('../cache/redis.js', () => ({
  getRedisClient: () => mockGetRedisClient(),
}));

describe('Filter Options Endpoint', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockRedisGet.mockReset();
    mockRedisSet.mockReset();
    mockGetRedisClient.mockReset();
    // By default, Redis is unavailable (no cache)
    mockGetRedisClient.mockReturnValue(null);
  });

  /**
   * Helper to invoke the GET / route handler on filterOptionsRouter.
   */
  async function callHandler(req?: Partial<Request>) {
    const { filterOptionsRouter } = await import('./filter-options.js');

    const request = (req ?? {}) as Request;

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
    } as unknown as Response;

    // Find the GET / handler on the router
    const layer = (filterOptionsRouter as any).stack.find(
      (l: any) => l.route?.path === '/' && l.route?.methods?.get,
    );
    const handler = layer.route.stack[0].handle;
    await handler(request, res, () => {});

    return { status: responseStatus, body: responseBody };
  }

  /**
   * Sets up mockQuery to return typical data rows for all 13 parallel queries.
   */
  function setupFullDataMocks() {
    // 1. Ranges
    mockQuery.mockResolvedValueOnce({
      rows: [{
        min_price: '25000',
        max_price: '500000',
        min_horsepower: '150',
        max_horsepower: '800',
        min_displacement: '1600',
        max_displacement: '6500',
        min_year: '1985',
        max_year: '2024',
        min_mileage: '500',
        max_mileage: '250000',
      }],
    });
    // 2. Drivetrains
    mockQuery.mockResolvedValueOnce({
      rows: [{ drivetrain: 'awd' }, { drivetrain: 'fwd' }, { drivetrain: 'rwd' }],
    });
    // 3. Colors
    mockQuery.mockResolvedValueOnce({
      rows: [{ exterior_color: 'black' }, { exterior_color: 'red' }, { exterior_color: 'white' }],
    });
    // 4. Seller types
    mockQuery.mockResolvedValueOnce({
      rows: [{ seller_type: 'dealer' }, { seller_type: 'private' }],
    });
    // 5. Door counts
    mockQuery.mockResolvedValueOnce({
      rows: [{ door_count: 2 }, { door_count: 4 }],
    });
    // 6. Seat counts
    mockQuery.mockResolvedValueOnce({
      rows: [{ seat_count: 2 }, { seat_count: 4 }, { seat_count: 5 }],
    });
    // 7. Conditions
    mockQuery.mockResolvedValueOnce({
      rows: [{ condition: 'new' }, { condition: 'used' }],
    });
    // 8. Engine detail configurations
    mockQuery.mockResolvedValueOnce({
      rows: [{ engine_detail_config: 'inline-6' }, { engine_detail_config: 'v8' }],
    });
    // 9. Forced induction details
    mockQuery.mockResolvedValueOnce({
      rows: [{ forced_induction_detail: 'naturally_aspirated' }, { forced_induction_detail: 'turbocharged' }],
    });
    // 10. Heritage era distribution
    mockQuery.mockResolvedValueOnce({
      rows: [
        { era: 'classic', count: '12' },
        { era: 'modern_classic', count: '45' },
        { era: 'contemporary', count: '88' },
      ],
    });
    // 11. Special edition count
    mockQuery.mockResolvedValueOnce({
      rows: [{ count: '7' }],
    });
    // 12. Makes
    mockQuery.mockResolvedValueOnce({
      rows: [{ make: 'BMW' }, { make: 'Ferrari' }, { make: 'Porsche' }],
    });
    // 13. Models by make
    mockQuery.mockResolvedValueOnce({
      rows: [
        { make: 'BMW', model: 'M3' },
        { make: 'BMW', model: 'M5' },
        { make: 'Ferrari', model: '488' },
        { make: 'Ferrari', model: 'F40' },
        { make: 'Porsche', model: '911' },
        { make: 'Porsche', model: 'Cayenne' },
      ],
    });
  }

  /**
   * Sets up mockQuery to return empty/null results for all 13 queries.
   */
  function setupEmptyDataMocks() {
    // 1. Ranges - all nulls
    mockQuery.mockResolvedValueOnce({
      rows: [{
        min_price: null,
        max_price: null,
        min_horsepower: null,
        max_horsepower: null,
        min_displacement: null,
        max_displacement: null,
        min_year: null,
        max_year: null,
        min_mileage: null,
        max_mileage: null,
      }],
    });
    // 2–9. Empty arrays for all discrete value queries
    for (let i = 0; i < 8; i++) {
      mockQuery.mockResolvedValueOnce({ rows: [] });
    }
    // 10. Heritage era - empty
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // 11. Special edition count - empty
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // 12. Makes - empty
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // 13. Models by make - empty
    mockQuery.mockResolvedValueOnce({ rows: [] });
  }

  describe('response structure', () => {
    it('should return a response matching the FilterOptionsResponse interface', async () => {
      setupFullDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      // Verify top-level keys exist
      expect(response).toHaveProperty('ranges');
      expect(response).toHaveProperty('drivetrains');
      expect(response).toHaveProperty('colors');
      expect(response).toHaveProperty('sellerTypes');
      expect(response).toHaveProperty('doorCounts');
      expect(response).toHaveProperty('seatCounts');
      expect(response).toHaveProperty('conditions');
      expect(response).toHaveProperty('engineDetailConfigurations');
      expect(response).toHaveProperty('forcedInductionDetails');
      expect(response).toHaveProperty('heritageEraDistribution');
      expect(response).toHaveProperty('specialEditionCount');
      expect(response).toHaveProperty('makes');
      expect(response).toHaveProperty('modelsByMake');

      // Verify ranges sub-structure
      expect(response.ranges).toHaveProperty('price');
      expect(response.ranges).toHaveProperty('horsepower');
      expect(response.ranges).toHaveProperty('engineDisplacement');
      expect(response.ranges).toHaveProperty('year');
      expect(response.ranges).toHaveProperty('mileage');

      // Each range has min/max
      for (const rangeKey of ['price', 'horsepower', 'engineDisplacement', 'year', 'mileage'] as const) {
        expect(response.ranges[rangeKey]).toHaveProperty('min');
        expect(response.ranges[rangeKey]).toHaveProperty('max');
        expect(typeof response.ranges[rangeKey].min).toBe('number');
        expect(typeof response.ranges[rangeKey].max).toBe('number');
      }

      // Verify arrays are arrays
      expect(Array.isArray(response.drivetrains)).toBe(true);
      expect(Array.isArray(response.colors)).toBe(true);
      expect(Array.isArray(response.sellerTypes)).toBe(true);
      expect(Array.isArray(response.doorCounts)).toBe(true);
      expect(Array.isArray(response.seatCounts)).toBe(true);
      expect(Array.isArray(response.conditions)).toBe(true);
      expect(Array.isArray(response.engineDetailConfigurations)).toBe(true);
      expect(Array.isArray(response.forcedInductionDetails)).toBe(true);
      expect(Array.isArray(response.makes)).toBe(true);

      // Verify heritage era distribution is a record with numeric values
      expect(typeof response.heritageEraDistribution).toBe('object');
      expect(typeof response.specialEditionCount).toBe('number');

      // Verify modelsByMake is a record
      expect(typeof response.modelsByMake).toBe('object');
    });

    it('should return correct values from populated database', async () => {
      setupFullDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.ranges.price).toEqual({ min: 25000, max: 500000 });
      expect(response.ranges.horsepower).toEqual({ min: 150, max: 800 });
      expect(response.ranges.engineDisplacement).toEqual({ min: 1600, max: 6500 });
      expect(response.ranges.year).toEqual({ min: 1985, max: 2024 });
      expect(response.ranges.mileage).toEqual({ min: 500, max: 250000 });

      expect(response.drivetrains).toEqual(['awd', 'fwd', 'rwd']);
      expect(response.colors).toEqual(['black', 'red', 'white']);
      expect(response.sellerTypes).toEqual(['dealer', 'private']);
      expect(response.doorCounts).toEqual([2, 4]);
      expect(response.seatCounts).toEqual([2, 4, 5]);
      expect(response.conditions).toEqual(['new', 'used']);
      expect(response.engineDetailConfigurations).toEqual(['inline-6', 'v8']);
      expect(response.forcedInductionDetails).toEqual(['naturally_aspirated', 'turbocharged']);
      expect(response.specialEditionCount).toBe(7);
      expect(response.makes).toEqual(['BMW', 'Ferrari', 'Porsche']);
    });
  });

  describe('fallback to DEFAULT_RANGES', () => {
    it('should use DEFAULT_RANGES when all database range values are null', async () => {
      setupEmptyDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.ranges.price).toEqual(DEFAULT_RANGES.price);
      expect(response.ranges.horsepower).toEqual(DEFAULT_RANGES.horsepower);
      expect(response.ranges.engineDisplacement).toEqual(DEFAULT_RANGES.engineDisplacement);
      expect(response.ranges.year).toEqual(DEFAULT_RANGES.year);
      expect(response.ranges.mileage).toEqual(DEFAULT_RANGES.mileage);
    });

    it('should return empty arrays for discrete filters when no data exists', async () => {
      setupEmptyDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.drivetrains).toEqual([]);
      expect(response.colors).toEqual([]);
      expect(response.sellerTypes).toEqual([]);
      expect(response.doorCounts).toEqual([]);
      expect(response.seatCounts).toEqual([]);
      expect(response.conditions).toEqual([]);
      expect(response.engineDetailConfigurations).toEqual([]);
      expect(response.forcedInductionDetails).toEqual([]);
      expect(response.makes).toEqual([]);
      expect(response.modelsByMake).toEqual({});
    });

    it('should return zero counts for heritage era distribution when no data exists', async () => {
      setupEmptyDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.heritageEraDistribution).toEqual({
        classic: 0,
        modern_classic: 0,
        contemporary: 0,
      });
      expect(response.specialEditionCount).toBe(0);
    });
  });

  describe('make/model dependency data format', () => {
    it('should correctly assemble modelsByMake from query rows', async () => {
      setupFullDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.modelsByMake).toEqual({
        BMW: ['M3', 'M5'],
        Ferrari: ['488', 'F40'],
        Porsche: ['911', 'Cayenne'],
      });
    });

    it('should handle a make with a single model', async () => {
      // Ranges
      mockQuery.mockResolvedValueOnce({
        rows: [{ min_price: '10000', max_price: '50000', min_horsepower: '100', max_horsepower: '300', min_displacement: '1000', max_displacement: '3000', min_year: '2000', max_year: '2023', min_mileage: '0', max_mileage: '100000' }],
      });
      // Discrete values (2–9)
      for (let i = 0; i < 8; i++) {
        mockQuery.mockResolvedValueOnce({ rows: [] });
      }
      // Heritage era distribution
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Special edition count
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Makes
      mockQuery.mockResolvedValueOnce({ rows: [{ make: 'Lamborghini' }] });
      // Models by make - single model
      mockQuery.mockResolvedValueOnce({ rows: [{ make: 'Lamborghini', model: 'Aventador' }] });

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.modelsByMake).toEqual({
        Lamborghini: ['Aventador'],
      });
    });

    it('should return empty modelsByMake when no listings exist', async () => {
      setupEmptyDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.modelsByMake).toEqual({});
    });
  });

  describe('heritage era distribution', () => {
    it('should correctly compute heritage era counts', async () => {
      setupFullDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.heritageEraDistribution).toEqual({
        classic: 12,
        modern_classic: 45,
        contemporary: 88,
      });
    });

    it('should default missing eras to 0', async () => {
      // Ranges
      mockQuery.mockResolvedValueOnce({
        rows: [{ min_price: '10000', max_price: '50000', min_horsepower: '100', max_horsepower: '300', min_displacement: '1000', max_displacement: '3000', min_year: '2015', max_year: '2024', min_mileage: '0', max_mileage: '50000' }],
      });
      // Discrete values (2–9)
      for (let i = 0; i < 8; i++) {
        mockQuery.mockResolvedValueOnce({ rows: [] });
      }
      // Heritage era - only contemporary listings exist
      mockQuery.mockResolvedValueOnce({ rows: [{ era: 'contemporary', count: '25' }] });
      // Special edition count
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] });
      // Makes
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Models by make
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(response.heritageEraDistribution).toEqual({
        classic: 0,
        modern_classic: 0,
        contemporary: 25,
      });
    });
  });

  describe('Redis caching behavior', () => {
    it('should return cached data on cache hit without querying the database', async () => {
      const cachedResponse: FilterOptionsResponse = {
        ranges: {
          price: { min: 5000, max: 300000 },
          horsepower: { min: 100, max: 700 },
          engineDisplacement: { min: 1000, max: 5000 },
          year: { min: 1990, max: 2024 },
          mileage: { min: 0, max: 200000 },
        },
        drivetrains: ['rwd', 'awd'],
        colors: ['blue'],
        sellerTypes: ['dealer'],
        doorCounts: [2, 4],
        seatCounts: [2, 4],
        conditions: ['used'],
        engineDetailConfigurations: ['v8'],
        forcedInductionDetails: ['turbocharged'],
        heritageEraDistribution: { classic: 5, modern_classic: 10, contemporary: 20 },
        specialEditionCount: 3,
        makes: ['Porsche'],
        modelsByMake: { Porsche: ['911', 'Cayman'] },
      };

      // Redis returns cached data
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedResponse));
      mockGetRedisClient.mockReturnValue({
        get: mockRedisGet,
        set: mockRedisSet,
      });

      const { body } = await callHandler();

      expect(body).toEqual(cachedResponse);
      // No database queries should have been made
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should query database and cache the result on cache miss', async () => {
      // Redis returns null (cache miss)
      mockRedisGet.mockResolvedValue(null);
      mockRedisSet.mockResolvedValue('OK');
      mockGetRedisClient.mockReturnValue({
        get: mockRedisGet,
        set: mockRedisSet,
      });

      setupFullDataMocks();

      const { body } = await callHandler();
      const response = body as FilterOptionsResponse;

      // Database was queried (13 parallel queries)
      expect(mockQuery).toHaveBeenCalledTimes(13);

      // Result was cached in Redis
      expect(mockRedisSet).toHaveBeenCalledWith(
        'filter-options:all',
        expect.any(String),
        { EX: 300 },
      );

      // Verify the cached value is valid JSON matching the response
      const cachedValue = JSON.parse(mockRedisSet.mock.calls[0][1]);
      expect(cachedValue).toEqual(response);
    });

    it('should gracefully handle Redis unavailability and serve from database', async () => {
      // Redis client is null (unavailable)
      mockGetRedisClient.mockReturnValue(null);

      setupFullDataMocks();

      const { body, status } = await callHandler();
      const response = body as FilterOptionsResponse;

      expect(status).toBe(200);
      expect(response.ranges.price).toEqual({ min: 25000, max: 500000 });
      expect(mockQuery).toHaveBeenCalledTimes(13);
    });

    it('should gracefully handle Redis errors on get and fall through to database', async () => {
      // Redis throws on get
      mockRedisGet.mockRejectedValue(new Error('Redis connection reset'));
      mockRedisSet.mockResolvedValue('OK');
      mockGetRedisClient.mockReturnValue({
        get: mockRedisGet,
        set: mockRedisSet,
      });

      setupFullDataMocks();

      const { body, status } = await callHandler();

      expect(status).toBe(200);
      expect(mockQuery).toHaveBeenCalledTimes(13);
    });
  });

  describe('error handling', () => {
    it('should return 200 with default values when database queries fail', async () => {
      // Redis not available
      mockGetRedisClient.mockReturnValue(null);
      // Database query fails
      mockQuery.mockRejectedValue(new Error('Connection refused'));

      const { status, body } = await callHandler();

      expect(status).toBe(200);
      // Should fall back to DEFAULT_RANGES and empty arrays
      expect(body.ranges).toBeDefined();
      expect(body.makes).toEqual([]);
      expect(body.drivetrains).toEqual([]);
      expect(body.colors).toEqual([]);
      expect(body.modelsByMake).toEqual({});
    });
  });
});
