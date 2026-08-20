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

// Mock the geocoding module
vi.mock('../map/geocoding.js', () => ({
  geocodeCity: vi.fn(),
}));

import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';
import { geocodeCity } from '../map/geocoding.js';

const mockQuery = vi.mocked(query);
const mockGetRedisClient = vi.mocked(getRedisClient);
const mockGeocodeCity = vi.mocked(geocodeCity);

/**
 * Helper: invoke the GET /locations handler directly via the router.
 * We import the router after mocks are registered and use Express's
 * internal handle mechanism to call it.
 */
async function callLocationsEndpoint(): Promise<{ status: number; body: unknown }> {
  const { mapRouter } = await import('./map.js');

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

    // Use the router's handle method to process the request
    (mapRouter as any).handle(req, res, (err?: Error) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message } });
      }
    });
  });
}

describe('GET /api/map/locations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Redis not available (cache miss)
    mockGetRedisClient.mockReturnValue(null);
  });

  describe('successful response structure', () => {
    it('returns 200 with locations, totalListings, and generatedAt', async () => {
      // Mock DB: one location with counts
      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Amsterdam', total_count: '5', dealer_count: '3', private_count: '2' },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Mock DB: preview listings
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            city: 'Amsterdam',
            id: 'listing-1',
            title: 'BMW M3',
            price: '85000',
            primary_image_url: 'https://img.example.com/1.jpg',
            make: 'BMW',
            model: 'M3',
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Mock geocoding: Amsterdam resolves
      mockGeocodeCity.mockReturnValue({ latitude: 52.3676, longitude: 4.9041 });

      const { status, body } = await callLocationsEndpoint();

      expect(status).toBe(200);
      const data = body as any;
      expect(data.locations).toHaveLength(1);
      expect(data.locations[0].city).toBe('Amsterdam');
      expect(data.locations[0].latitude).toBe(52.3676);
      expect(data.locations[0].longitude).toBe(4.9041);
      expect(data.locations[0].totalCount).toBe(5);
      expect(data.locations[0].dealerCount).toBe(3);
      expect(data.locations[0].privateCount).toBe(2);
      expect(data.locations[0].previews).toHaveLength(1);
      expect(data.locations[0].previews[0].id).toBe('listing-1');
      expect(data.totalListings).toBe(5);
      expect(data.generatedAt).toBeDefined();
      expect(new Date(data.generatedAt).toISOString()).toBe(data.generatedAt);
    });
  });

  describe('database error returns 500', () => {
    it('returns 500 with error message when database query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const { status, body } = await callLocationsEndpoint();

      expect(status).toBe(500);
      expect((body as any).error).toBe('Failed to fetch map locations');
    });
  });

  describe('empty results return 200 with empty locations', () => {
    it('returns 200 with empty locations array and totalListings 0', async () => {
      // Mock DB: no active listings
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as any);

      const { status, body } = await callLocationsEndpoint();

      expect(status).toBe(200);
      const data = body as any;
      expect(data.locations).toEqual([]);
      expect(data.totalListings).toBe(0);
      expect(data.generatedAt).toBeDefined();
    });
  });

  describe('cache hit serves cached data', () => {
    it('returns cached response without querying the database', async () => {
      const cachedResponse = {
        locations: [
          {
            city: 'Rotterdam',
            latitude: 51.9244,
            longitude: 4.4777,
            totalCount: 3,
            dealerCount: 2,
            privateCount: 1,
            previews: [],
          },
        ],
        totalListings: 3,
        generatedAt: '2024-01-15T10:00:00.000Z',
      };

      // Mock Redis: cache hit
      const mockRedis = {
        get: vi.fn().mockResolvedValue(JSON.stringify(cachedResponse)),
        set: vi.fn().mockResolvedValue('OK'),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const { status, body } = await callLocationsEndpoint();

      expect(status).toBe(200);
      expect(body).toEqual(cachedResponse);
      // Database should NOT be called
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('cache miss queries database', () => {
    it('queries the database and caches the result on cache miss', async () => {
      // Mock Redis: cache miss (get returns null), then set succeeds
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      // Mock DB: one location
      mockQuery.mockResolvedValueOnce({
        rows: [
          { city: 'Utrecht', total_count: '2', dealer_count: '1', private_count: '1' },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Mock DB: preview listings
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            city: 'Utrecht',
            id: 'listing-2',
            title: 'Audi RS6',
            price: 120000,
            primary_image_url: null,
            make: 'Audi',
            model: 'RS6',
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any);

      // Mock geocoding
      mockGeocodeCity.mockReturnValue({ latitude: 52.0907, longitude: 5.1214 });

      const { status, body } = await callLocationsEndpoint();

      expect(status).toBe(200);
      const data = body as any;
      expect(data.locations).toHaveLength(1);
      expect(data.locations[0].city).toBe('Utrecht');

      // Verify database was queried
      expect(mockQuery).toHaveBeenCalledTimes(2);

      // Verify result was cached with TTL 300
      expect(mockRedis.set).toHaveBeenCalledWith(
        'map:locations',
        expect.any(String),
        { EX: 300 },
      );
    });
  });
});
