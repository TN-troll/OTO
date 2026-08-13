import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeaturedListingService, NotFoundError, ValidationError } from './featured.js';

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { query, queryOne } from '../db/connection.js';

const mockQuery = vi.mocked(query);
const mockQueryOne = vi.mocked(queryOne);

describe('FeaturedListingService', () => {
  let service: FeaturedListingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FeaturedListingService();
  });

  describe('setFeatured()', () => {
    it('should set a listing as featured with the given sort order', async () => {
      mockQueryOne.mockResolvedValue({ id: 'uuid-1', status: 'active' } as any);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await service.setFeatured('uuid-1', 5);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE listings SET is_featured = TRUE'),
        ['uuid-1', 5],
      );
    });

    it('should throw NotFoundError when listing does not exist', async () => {
      mockQueryOne.mockResolvedValue(null as any);

      await expect(service.setFeatured('nonexistent', 1)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when listing is not active', async () => {
      mockQueryOne.mockResolvedValue({ id: 'uuid-1', status: 'sold' } as any);

      await expect(service.setFeatured('uuid-1', 1)).rejects.toThrow(ValidationError);
      await expect(service.setFeatured('uuid-1', 1)).rejects.toThrow(
        /Cannot feature a listing with status "sold"/,
      );
    });

    it('should throw ValidationError for stale listings', async () => {
      mockQueryOne.mockResolvedValue({ id: 'uuid-1', status: 'stale' } as any);

      await expect(service.setFeatured('uuid-1', 1)).rejects.toThrow(ValidationError);
    });
  });

  describe('removeFeatured()', () => {
    it('should remove the featured flag and reset sort order', async () => {
      mockQueryOne.mockResolvedValue({ id: 'uuid-1' } as any);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await service.removeFeatured('uuid-1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_featured = FALSE'),
        ['uuid-1'],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('featured_sort_order = 0'),
        ['uuid-1'],
      );
    });

    it('should throw NotFoundError when listing does not exist', async () => {
      mockQueryOne.mockResolvedValue(null as any);

      await expect(service.removeFeatured('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFeaturedListings()', () => {
    it('should return featured active listings ordered by sort order', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'uuid-1',
            title: 'Ferrari 488',
            make: 'Ferrari',
            model: '488 GTB',
            year: 2020,
            price: 250000,
            status: 'active',
            is_featured: true,
            featured_sort_order: 1,
            image_urls: ['https://example.com/img1.jpg'],
            date_added: new Date('2024-01-15'),
          },
          {
            id: 'uuid-2',
            title: 'Porsche 911',
            make: 'Porsche',
            model: '911',
            year: 2021,
            price: 180000,
            status: 'active',
            is_featured: true,
            featured_sort_order: 2,
            image_urls: ['https://example.com/img2.jpg'],
            date_added: new Date('2024-02-10'),
          },
        ],
      } as any);

      const result = await service.getFeaturedListings();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('uuid-1');
      expect(result[0].isFeatured).toBe(true);
      expect(result[0].featuredSortOrder).toBe(1);
      expect(result[1].id).toBe('uuid-2');
      expect(result[1].featuredSortOrder).toBe(2);
    });

    it('should only return active listings (excludes sold)', async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any);

      await service.getFeaturedListings();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("is_featured = TRUE AND status = 'active'"),
      );
    });

    it('should parse string prices to numbers', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'uuid-1',
            title: 'BMW M5',
            make: 'BMW',
            model: 'M5',
            year: 2022,
            price: '125000.50',
            status: 'active',
            is_featured: true,
            featured_sort_order: 1,
            image_urls: [],
            date_added: new Date(),
          },
        ],
      } as any);

      const result = await service.getFeaturedListings();

      expect(result[0].price).toBe(125000.5);
    });

    it('should handle null image_urls', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'uuid-1',
            title: 'Audi R8',
            make: 'Audi',
            model: 'R8',
            year: 2019,
            price: 200000,
            status: 'active',
            is_featured: true,
            featured_sort_order: 1,
            image_urls: null,
            date_added: new Date(),
          },
        ],
      } as any);

      const result = await service.getFeaturedListings();

      expect(result[0].primaryImageUrl).toBeNull();
    });
  });
});
