import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MarketplaceId } from '@car-ads/shared';
import {
  MARKETPLACE_RETRY_MAX_ATTEMPTS,
  MARKETPLACE_RETRY_INITIAL_DELAY_MS,
  MARKETPLACE_UNREACHABLE_THRESHOLD_MS,
} from '@car-ads/shared';

// Mock BullMQ
const mockAdd = vi.fn().mockResolvedValue({});
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockGetJob = vi.fn();

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation((name: string, opts: unknown) => ({
    name,
    add: mockAdd,
    close: mockClose,
    getJob: mockGetJob,
  })),
  Worker: vi.fn(),
  QueueEvents: vi.fn(),
}));

// Mock node-cron
const mockSchedule = vi.fn().mockReturnValue({ stop: vi.fn() });
vi.mock('node-cron', () => ({
  default: { schedule: (...args: unknown[]) => mockSchedule(...args) },
  schedule: (...args: unknown[]) => mockSchedule(...args),
}));

// Mock database
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    DATABASE_URL: 'postgresql://localhost:5432/car_ads_test',
    REDIS_URL: 'redis://localhost:6379',
    PORT: 3000,
    NODE_ENV: 'test',
  },
}));

import { ScraperCoordinator } from './scraper-coordinator.js';

describe('ScraperCoordinator', () => {
  let coordinator: ScraperCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    coordinator = new ScraperCoordinator();
  });

  afterEach(async () => {
    await coordinator.shutdown();
  });

  describe('scheduleCollection', () => {
    it('should schedule a cron job that runs every 30 minutes', () => {
      coordinator.scheduleCollection('autotrack');

      expect(mockSchedule).toHaveBeenCalledWith(
        '*/30 * * * *',
        expect.any(Function),
      );
    });

    it('should enqueue a collection job when cron fires', async () => {
      coordinator.scheduleCollection('autoscout24');

      // Extract and invoke the cron callback
      const cronCallback = mockSchedule.mock.calls[0][1] as () => Promise<void>;
      await cronCallback();

      expect(mockAdd).toHaveBeenCalledWith(
        'collect-autoscout24',
        expect.objectContaining({
          marketplace: 'autoscout24',
          scheduledAt: expect.any(String),
        }),
        expect.objectContaining({
          jobId: expect.stringContaining('collect-autoscout24-'),
        }),
      );
    });
  });

  describe('scheduleVerification', () => {
    it('should schedule a cron job that runs every 60 minutes', () => {
      coordinator.scheduleVerification('marktplaats');

      expect(mockSchedule).toHaveBeenCalledWith(
        '0 * * * *',
        expect.any(Function),
      );
    });

    it('should enqueue a verification job when cron fires', async () => {
      coordinator.scheduleVerification('autotrack');

      const cronCallback = mockSchedule.mock.calls[0][1] as () => Promise<void>;
      await cronCallback();

      expect(mockAdd).toHaveBeenCalledWith(
        'verify-autotrack',
        expect.objectContaining({
          marketplace: 'autotrack',
          scheduledAt: expect.any(String),
        }),
        expect.objectContaining({
          jobId: expect.stringContaining('verify-autotrack-'),
        }),
      );
    });
  });

  describe('getMarketplaceHealth', () => {
    it('should return healthy status when no record exists', async () => {
      mockQueryOne.mockResolvedValue(null);

      const health = await coordinator.getMarketplaceHealth('autotrack');

      expect(health.marketplace).toBe('autotrack');
      expect(health.status).toBe('healthy');
      expect(health.consecutiveFailures).toBe(0);
      expect(health.unreachableSince).toBeNull();
    });

    it('should return the stored status for a healthy marketplace', async () => {
      const lastContact = new Date('2024-01-01T12:00:00Z');
      mockQueryOne.mockResolvedValue({
        marketplace: 'autoscout24',
        status: 'healthy',
        last_successful_contact: lastContact,
        consecutive_failures: 0,
        unreachable_since: null,
        updated_at: new Date(),
      });

      const health = await coordinator.getMarketplaceHealth('autoscout24');

      expect(health.marketplace).toBe('autoscout24');
      expect(health.status).toBe('healthy');
      expect(health.lastSuccessfulContact).toEqual(lastContact);
      expect(health.consecutiveFailures).toBe(0);
      expect(health.unreachableSince).toBeNull();
    });

    it('should return degraded status when failures exist but under 4 hours', async () => {
      const recentUnreachable = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      mockQueryOne.mockResolvedValue({
        marketplace: 'marktplaats',
        status: 'degraded',
        last_successful_contact: new Date('2024-01-01T10:00:00Z'),
        consecutive_failures: 2,
        unreachable_since: recentUnreachable,
        updated_at: new Date(),
      });

      const health = await coordinator.getMarketplaceHealth('marktplaats');

      expect(health.status).toBe('degraded');
      expect(health.consecutiveFailures).toBe(2);
      expect(health.unreachableSince).toEqual(recentUnreachable);
    });

    it('should return unreachable status when unreachable for more than 4 hours', async () => {
      const longUnreachable = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      mockQueryOne.mockResolvedValue({
        marketplace: 'autotrack',
        status: 'degraded',
        last_successful_contact: new Date('2024-01-01T08:00:00Z'),
        consecutive_failures: 10,
        unreachable_since: longUnreachable,
        updated_at: new Date(),
      });

      const health = await coordinator.getMarketplaceHealth('autotrack');

      expect(health.status).toBe('unreachable');
      expect(health.unreachableSince).toEqual(longUnreachable);
    });

    it('should use exactly the 4-hour threshold from constants', () => {
      expect(MARKETPLACE_UNREACHABLE_THRESHOLD_MS).toBe(4 * 60 * 60 * 1000);
    });
  });

  describe('recordSuccess', () => {
    it('should upsert marketplace health to healthy with reset counters', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await coordinator.recordSuccess('autotrack');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO marketplace_health'),
        ['autotrack'],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'healthy'"),
        ['autotrack'],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('consecutive_failures = 0'),
        ['autotrack'],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('unreachable_since = NULL'),
        ['autotrack'],
      );
    });
  });

  describe('recordFailure', () => {
    it('should upsert marketplace health with incremented failure count', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await coordinator.recordFailure('autoscout24');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO marketplace_health'),
        ['autoscout24'],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('consecutive_failures = marketplace_health.consecutive_failures + 1'),
        ['autoscout24'],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(marketplace_health.unreachable_since, NOW())'),
        ['autoscout24'],
      );
    });
  });

  describe('retryFailed', () => {
    it('should retry a job found in the collection queue', async () => {
      const mockRetry = vi.fn().mockResolvedValue(undefined);
      mockGetJob.mockResolvedValueOnce({ retry: mockRetry });

      await coordinator.retryFailed('some-job-id');

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should retry a job found in the verification queue when not in collection', async () => {
      const mockRetry = vi.fn().mockResolvedValue(undefined);
      mockGetJob
        .mockResolvedValueOnce(null) // Not in collection queue
        .mockResolvedValueOnce({ retry: mockRetry }); // Found in verification queue

      await coordinator.retryFailed('verify-job-id');

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should throw when job is not found in any queue', async () => {
      mockGetJob.mockResolvedValue(null);

      await expect(coordinator.retryFailed('nonexistent')).rejects.toThrow(
        'Job with ID "nonexistent" not found in any queue.',
      );
    });
  });

  describe('retry configuration', () => {
    it('should use 3 max attempts from constants', () => {
      expect(MARKETPLACE_RETRY_MAX_ATTEMPTS).toBe(3);
    });

    it('should use 30s initial delay that doubles (30s, 60s, 120s)', () => {
      expect(MARKETPLACE_RETRY_INITIAL_DELAY_MS).toBe(30_000);
      // BullMQ exponential backoff doubles: 30000, 60000, 120000
    });
  });

  describe('shutdown', () => {
    it('should stop all cron jobs and close queues', async () => {
      coordinator.scheduleCollection('autotrack');
      coordinator.scheduleVerification('autotrack');

      await coordinator.shutdown();

      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });
});
