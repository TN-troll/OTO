import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClickTracker } from './click-tracker.js';

// Mock the database connection module
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

describe('ClickTracker', () => {
  let tracker: ClickTracker;

  beforeEach(() => {
    tracker = new ClickTracker();
    mockQuery.mockReset();
    mockQueryOne.mockReset();
  });

  describe('trackClick', () => {
    it('should insert click record, upsert counts, and return redirect URL', async () => {
      // Mock: INSERT into listing_clicks
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      // Mock: UPSERT into listing_click_counts
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      // Mock: SELECT source URL
      mockQueryOne.mockResolvedValueOnce({ url: 'https://www.autoscout24.nl/aanbod/porsche-911' });

      const result = await tracker.trackClick('listing-123', 'session-abc');

      expect(result).toBe('https://www.autoscout24.nl/aanbod/porsche-911');

      // Verify INSERT into listing_clicks
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO listing_clicks'),
        ['listing-123', 'session-abc'],
      );

      // Verify UPSERT into listing_click_counts
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO listing_click_counts'),
        ['listing-123'],
      );

      // Verify source URL query
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT url FROM source_references'),
        ['listing-123'],
      );
    });

    it('should return null when no source URL is found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      mockQueryOne.mockResolvedValueOnce(null);

      const result = await tracker.trackClick('listing-999', 'session-xyz');

      expect(result).toBeNull();
    });
  });

  describe('getClickStats', () => {
    it('should return click stats for a listing with clicks', async () => {
      const lastClicked = new Date('2024-06-15T10:00:00Z');
      mockQueryOne.mockResolvedValueOnce({
        click_count: '42',
        last_clicked_at: lastClicked,
      });

      const stats = await tracker.getClickStats('listing-123');

      expect(stats).toEqual({
        listingId: 'listing-123',
        totalClicks: 42,
        lastClickedAt: lastClicked,
      });
    });

    it('should return zero clicks when no record exists', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const stats = await tracker.getClickStats('listing-new');

      expect(stats).toEqual({
        listingId: 'listing-new',
        totalClicks: 0,
        lastClickedAt: null,
      });
    });
  });

  describe('getAggregateStats', () => {
    it('should return aggregate stats sorted by clicks (default)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            listing_id: 'l1',
            title: 'Porsche 911',
            make: 'Porsche',
            model: '911',
            click_count: '100',
            last_clicked_at: new Date('2024-06-15'),
          },
          {
            listing_id: 'l2',
            title: 'BMW M3',
            make: 'BMW',
            model: 'M3',
            click_count: '50',
            last_clicked_at: new Date('2024-06-14'),
          },
        ],
      });

      const stats = await tracker.getAggregateStats();

      expect(stats).toHaveLength(2);
      expect(stats[0].clickCount).toBe(100);
      expect(stats[0].listingId).toBe('l1');
      expect(stats[1].clickCount).toBe(50);

      // Default sort is by clicks DESC
      const sqlCall = mockQuery.mock.calls[0][0];
      expect(sqlCall).toContain('ORDER BY cc.click_count DESC');
    });

    it('should support sorting by recent', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await tracker.getAggregateStats({ sortBy: 'recent' });

      const sqlCall = mockQuery.mock.calls[0][0];
      expect(sqlCall).toContain('ORDER BY cc.last_clicked_at DESC');
    });

    it('should filter by since date', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const since = new Date('2024-01-01');
      await tracker.getAggregateStats({ since });

      const sqlCall = mockQuery.mock.calls[0][0];
      expect(sqlCall).toContain('WHERE cc.last_clicked_at >= $1');
      expect(mockQuery.mock.calls[0][1]).toContain(since);
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await tracker.getAggregateStats({ limit: 10 });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(10);
    });

    it('should default limit to 50', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await tracker.getAggregateStats();

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain(50);
    });
  });
});
