// Feature: interactive-dealer-map
// Integration tests for the full map endpoint flow
// Validates: Requirements 5.1, 5.2, 5.3

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

// Mock the Redis cache module
vi.mock('../cache/redis.js', () => ({
  getRedisClient: vi.fn(),
}));

// Mock the geocoding module — use a realistic partial implementation
vi.mock('../map/geocoding.js', () => ({
  geocodeCity: vi.fn(),
}));

import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';
import { geocodeCity } from '../map/geocoding.js';

const mockQuery = vi.mocked(query);
const mockGetRedisClient = vi.mocked(getRedisClient);
const mockGeocodeCity = vi.mocked(geocodeCity);

/** Realistic Dutch city coordinates for geocoding mock */
const GEOCODABLE_CITIES: Record<string, { latitude: number; longitude: number }> = {
  Amsterdam: { latitude: 52.3676, longitude: 4.9041 },
  Rotterdam: { latitude: 51.9244, longitude: 4.4777 },
  Utrecht: { latitude: 52.0907, longitude: 5.1214 },
  Eindhoven: { latitude: 51.4416, longitude: 5.4697 },
};

/**
 * Setup geocodeCity mock to behave like the real geocoding service:
 * returns coordinates for known Dutch cities, null for unknown ones.
 */
function setupRealisticGeocoding(): void {
  mockGeocodeCity.mockImplementation((city: string) => {
    const coords = GEOCODABLE_CITIES[city];
    return coords ?? null;
  });
}

/**
 * Invoke the GET /locations handler via the Express router handle mechanism.
 */
async function callLocationsEndpoint(): Promise<{ status: number; body: unknown }> {
  const { mapRouter } = await import('../api/map.js');

  return new Promise((resolve) => {
    const req = {
      method: 'GET',
      url: '/locations',
      path: '/locations',
      headers: {},
    } as unknown as Request;

    let statusCode = 200;
    let responseBody: unknown;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        responseBody = body;
        resolve({ status: statusCode, body: responseBody });
      },
    } as unknown as Response;

    (mapRouter as any).handle(req, res, (err?: Error) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message } });
      }
    });
  });
}

describe('Map Integration Tests - Full Map Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupRealisticGeocoding();
  });

  describe('GET /api/map/locations returns valid response', () => {
    it('returns a complete MapLocationsResponse with multiple geocoded locations', { timeout: 15000 }, async () => {
      // No Redis available — direct DB flow
      mockGetRedisClient.mockReturnValue(null);

      // DB query 1: locations with mix of geocodable and non-geocodable cities
      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Amsterdam', total_count: '12', dealer_count: '8', private_count: '4' },
          { city: 'Rotterdam', total_count: '7', dealer_count: '5', private_count: '2' },
          { city: 'Unknownville', total_count: '3', dealer_count: '0', private_count: '3' },
          { city: 'Utrecht', total_count: '4', dealer_count: '2', private_count: '2' },
        ],
        command: 'SELECT',
        rowCount: 4,
        oid: 0,
        fields: [],
      } as any);

      // DB query 2: preview listings for all cities
      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Amsterdam', id: 'a1', title: 'Porsche 911 GT3', price: '195000', primary_image_url: 'https://img.test/a1.jpg', make: 'Porsche', model: '911 GT3' },
          { city: 'Amsterdam', id: 'a2', title: 'BMW M4 Competition', price: '98000', primary_image_url: 'https://img.test/a2.jpg', make: 'BMW', model: 'M4' },
          { city: 'Amsterdam', id: 'a3', title: 'Mercedes-AMG GT', price: '145000', primary_image_url: null, make: 'Mercedes-Benz', model: 'AMG GT' },
          { city: 'Rotterdam', id: 'r1', title: 'Audi RS6 Avant', price: '125000', primary_image_url: 'https://img.test/r1.jpg', make: 'Audi', model: 'RS6' },
          { city: 'Rotterdam', id: 'r2', title: 'Lamborghini Huracán', price: '289000', primary_image_url: 'https://img.test/r2.jpg', make: 'Lamborghini', model: 'Huracán' },
          { city: 'Unknownville', id: 'u1', title: 'VW Golf GTI', price: '35000', primary_image_url: 'https://img.test/u1.jpg', make: 'Volkswagen', model: 'Golf' },
          { city: 'Utrecht', id: 'ut1', title: 'Ferrari 488', price: '225000', primary_image_url: 'https://img.test/ut1.jpg', make: 'Ferrari', model: '488' },
        ],
        command: 'SELECT',
        rowCount: 7,
        oid: 0,
        fields: [],
      } as any);

      const { status, body } = await callLocationsEndpoint();
      const data = body as any;

      // Validates Req 5.1: endpoint returns valid response
      expect(status).toBe(200);

      // Validates Req 5.2: response structure
      expect(data).toHaveProperty('locations');
      expect(data).toHaveProperty('totalListings');
      expect(data).toHaveProperty('generatedAt');
      expect(Array.isArray(data.locations)).toBe(true);
      expect(typeof data.totalListings).toBe('number');
      expect(new Date(data.generatedAt).toISOString()).toBe(data.generatedAt);

      // Validates Req 5.3: only active listings with valid geocoding
      expect(data.locations.length).toBe(3); // Amsterdam, Rotterdam, Utrecht (not Unknownville)
      expect(data.totalListings).toBe(23); // 12 + 7 + 4 (excludes Unknownville's 3)

      // Verify each location has full structure
      for (const loc of data.locations) {
        expect(loc.city).toBeTruthy();
        expect(typeof loc.latitude).toBe('number');
        expect(typeof loc.longitude).toBe('number');
        expect(loc.latitude).toBeGreaterThanOrEqual(50.7);
        expect(loc.latitude).toBeLessThanOrEqual(53.6);
        expect(loc.longitude).toBeGreaterThanOrEqual(3.3);
        expect(loc.longitude).toBeLessThanOrEqual(7.3);
        expect(loc.totalCount).toBeGreaterThanOrEqual(1);
        expect(loc.dealerCount).toBeGreaterThanOrEqual(0);
        expect(loc.privateCount).toBeGreaterThanOrEqual(0);
        expect(loc.dealerCount + loc.privateCount).toBe(loc.totalCount);
        expect(Array.isArray(loc.previews)).toBe(true);
        expect(loc.previews.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('response contains only geocodable locations', () => {
    it('filters out cities that cannot be geocoded', async () => {
      mockGetRedisClient.mockReturnValue(null);

      // Include cities that are NOT in the geocoding lookup
      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Amsterdam', total_count: '5', dealer_count: '3', private_count: '2' },
          { city: 'Unknownville', total_count: '2', dealer_count: '0', private_count: '2' },
          { city: 'Eindhoven', total_count: '3', dealer_count: '1', private_count: '2' },
          { city: 'FakeCity', total_count: '1', dealer_count: '0', private_count: '1' },
        ],
        command: 'SELECT',
        rowCount: 4,
        oid: 0,
        fields: [],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Amsterdam', id: 'a1', title: 'Test Car 1', price: '50000', primary_image_url: null, make: 'BMW', model: 'X5' },
          { city: 'Unknownville', id: 'u1', title: 'Test Car 2', price: '30000', primary_image_url: null, make: 'Ford', model: 'Focus' },
          { city: 'Eindhoven', id: 'e1', title: 'Test Car 3', price: '75000', primary_image_url: null, make: 'Audi', model: 'Q7' },
          { city: 'FakeCity', id: 'f1', title: 'Test Car 4', price: '20000', primary_image_url: null, make: 'Fiat', model: '500' },
        ],
        command: 'SELECT',
        rowCount: 4,
        oid: 0,
        fields: [],
      } as any);

      const { status, body } = await callLocationsEndpoint();
      const data = body as any;

      expect(status).toBe(200);

      // Only geocodable cities should be included
      const returnedCities = data.locations.map((l: any) => l.city);
      expect(returnedCities).toContain('Amsterdam');
      expect(returnedCities).toContain('Eindhoven');
      expect(returnedCities).not.toContain('Unknownville');
      expect(returnedCities).not.toContain('FakeCity');
      expect(data.locations.length).toBe(2);

      // totalListings only counts geocodable locations
      expect(data.totalListings).toBe(8); // 5 + 3
    });
  });

  describe('Redis cache is populated after first request', () => {
    it('populates cache on first request and serves from cache on second', async () => {
      // Setup Redis mock with storage tracking
      const cacheStore = new Map<string, string>();
      const mockRedis = {
        get: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
        set: vi.fn(async (key: string, value: string, _opts?: any) => {
          cacheStore.set(key, value);
          return 'OK';
        }),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      // First request: DB returns data, cache is empty
      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Rotterdam', total_count: '6', dealer_count: '4', private_count: '2' },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Rotterdam', id: 'r1', title: 'McLaren 720S', price: '275000', primary_image_url: 'https://img.test/r1.jpg', make: 'McLaren', model: '720S' },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // First call — cache miss, DB query, then cache set
      const result1 = await callLocationsEndpoint();
      expect(result1.status).toBe(200);

      // Verify cache was populated
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'map:locations',
        expect.any(String),
        { EX: 300 },
      );

      // Verify stored value is valid JSON with correct structure
      const cachedValue = cacheStore.get('map:locations');
      expect(cachedValue).toBeDefined();
      const parsedCache = JSON.parse(cachedValue!);
      expect(parsedCache.locations).toHaveLength(1);
      expect(parsedCache.locations[0].city).toBe('Rotterdam');
      expect(parsedCache.totalListings).toBe(6);

      // Second call — should hit cache, no new DB queries
      vi.clearAllMocks();
      mockGetRedisClient.mockReturnValue(mockRedis as any);
      setupRealisticGeocoding();

      const result2 = await callLocationsEndpoint();
      expect(result2.status).toBe(200);
      expect(result2.body).toEqual(parsedCache);

      // Database should NOT be queried on cache hit
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
