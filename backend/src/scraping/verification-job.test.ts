import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarketplaceId, ListingStatus } from '@car-ads/shared';
import type { MarketplaceScraper } from './marketplace-scraper.js';
import type { VerificationJobData } from './scraper-coordinator.js';
import type { Job } from 'bullmq';

// Mock database
const mockQuery = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: vi.fn(),
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

// Mock BullMQ
const mockQueueAdd = vi.fn().mockResolvedValue({});
const mockQueueClose = vi.fn().mockResolvedValue(undefined);
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose,
    getJob: vi.fn(),
  })),
  Worker: vi.fn(),
  QueueEvents: vi.fn(),
}));

// Mock node-cron
vi.mock('node-cron', () => ({
  default: { schedule: vi.fn().mockReturnValue({ stop: vi.fn() }) },
  schedule: vi.fn().mockReturnValue({ stop: vi.fn() }),
}));

import { VerificationJob } from './verification-job.js';
import { ScraperCoordinator } from './scraper-coordinator.js';

/** Helper to create a mock marketplace scraper */
function createMockScraper(
  marketplace: MarketplaceId,
  verifyFn: (url: string) => Promise<ListingStatus>,
): MarketplaceScraper {
  return {
    collectListings: vi.fn().mockResolvedValue([]),
    verifyListing: vi.fn(verifyFn),
    getMarketplaceId: () => marketplace,
  };
}

/** Helper to create a mock BullMQ job */
function createMockJob(data: VerificationJobData): Job<VerificationJobData> {
  return {
    data,
    id: 'test-job-1',
    name: `verify-${data.marketplace}`,
  } as unknown as Job<VerificationJobData>;
}

describe('VerificationJob', () => {
  let coordinator: ScraperCoordinator;
  let verificationJob: VerificationJob;
  let mockAutotrackScraper: MarketplaceScraper;
  let scrapers: Map<MarketplaceId, MarketplaceScraper>;

  beforeEach(() => {
    vi.clearAllMocks();

    coordinator = new ScraperCoordinator();

    // Default: all verifications return 'active'
    mockAutotrackScraper = createMockScraper('autotrack', async () => 'active');
    scrapers = new Map<MarketplaceId, MarketplaceScraper>([
      ['autotrack', mockAutotrackScraper],
    ]);

    verificationJob = new VerificationJob(scrapers, coordinator);

    // Default mock: marketplace is healthy
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('SELECT') && sql.includes('marketplace_health')) {
        return { rows: [] };
      }
      if (sql.includes('SELECT') && sql.includes('listings') && sql.includes('source_references')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE')) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('INSERT')) {
        return { rows: [] };
      }
      if (sql.includes('COUNT')) {
        return { rows: [{ count: '0' }] };
      }
      return { rows: [] };
    });
  });

  describe('process', () => {
    it('should process a BullMQ job and return verification results', async () => {
      const job = createMockJob({
        marketplace: 'autotrack',
        scheduledAt: new Date().toISOString(),
      });

      const result = await verificationJob.process(job);

      expect(result.marketplace).toBe('autotrack');
      expect(result.totalVerified).toBe(0);
    });

    it('should throw if no scraper is registered for the marketplace', async () => {
      const emptyScrapers = new Map<MarketplaceId, MarketplaceScraper>();
      const vJob = new VerificationJob(emptyScrapers, coordinator);

      const job = createMockJob({
        marketplace: 'autotrack',
        scheduledAt: new Date().toISOString(),
      });

      await expect(vJob.process(job)).rejects.toThrow(
        'No scraper registered for marketplace: autotrack',
      );
    });
  });

  describe('verifyMarketplace', () => {
    it('should verify all active listings for a marketplace', async () => {
      // Mock: return two active listings
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
              {
                listing_id: 'listing-2',
                source_url: 'https://autotrack.nl/ad/2',
                marketplace: 'autotrack',
                source_reference_id: 'sr-2',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await verificationJob.verifyMarketplace('autotrack');

      expect(result.totalVerified).toBe(2);
      expect(result.active).toBe(2);
      expect(result.inactive).toBe(0);
      expect(result.unknown).toBe(0);
    });

    it('should mark listing as verified when source is active', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await verificationJob.verifyMarketplace('autotrack');

      // Should have called UPDATE to set last_verified
      const updateCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('UPDATE listings') && call[0].includes('last_verified'),
      );
      expect(updateCalls.length).toBe(1);
      expect(updateCalls[0][1]).toEqual(['listing-1']);
    });

    it('should mark source as inactive and deactivate listing when no active sources remain', async () => {
      // Scraper returns inactive for the listing
      const inactiveScraper = createMockScraper('autotrack', async () => 'inactive');
      const inactiveScrapers = new Map<MarketplaceId, MarketplaceScraper>([
        ['autotrack', inactiveScraper],
      ]);
      const vJob = new VerificationJob(inactiveScrapers, coordinator);

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('COUNT')) {
          // No remaining active sources
          return { rows: [{ count: '0' }] };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await vJob.verifyMarketplace('autotrack');

      expect(result.inactive).toBe(1);

      // Should mark source reference as inactive
      const sourceInactiveCalls = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE source_references') &&
          call[0].includes('is_active = FALSE'),
      );
      expect(sourceInactiveCalls.length).toBe(1);

      // Should deactivate listing when no active sources remain
      const listingInactiveCalls = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE listings') &&
          call[0].includes("status = 'inactive'"),
      );
      expect(listingInactiveCalls.length).toBe(1);
    });

    it('should NOT deactivate listing when other active sources remain', async () => {
      const inactiveScraper = createMockScraper('autotrack', async () => 'inactive');
      const inactiveScrapers = new Map<MarketplaceId, MarketplaceScraper>([
        ['autotrack', inactiveScraper],
      ]);
      const vJob = new VerificationJob(inactiveScrapers, coordinator);

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('COUNT')) {
          // One active source still remains (from another marketplace)
          return { rows: [{ count: '1' }] };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await vJob.verifyMarketplace('autotrack');

      // Should NOT deactivate the listing
      const listingInactiveCalls = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE listings') &&
          call[0].includes("status = 'inactive'"),
      );
      expect(listingInactiveCalls.length).toBe(0);
    });

    it('should handle unknown verification status without changing listing state', async () => {
      const unknownScraper = createMockScraper('autotrack', async () => 'unknown');
      const unknownScrapers = new Map<MarketplaceId, MarketplaceScraper>([
        ['autotrack', unknownScraper],
      ]);
      const vJob = new VerificationJob(unknownScrapers, coordinator);

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await vJob.verifyMarketplace('autotrack');

      expect(result.unknown).toBe(1);

      // Should not update last_verified or mark inactive
      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE listings'),
      );
      expect(updateCalls.length).toBe(0);
    });

    it('should handle scraper errors gracefully and count as unknown', async () => {
      const errorScraper = createMockScraper('autotrack', async () => {
        throw new Error('Network timeout');
      });
      const errorScrapers = new Map<MarketplaceId, MarketplaceScraper>([
        ['autotrack', errorScraper],
      ]);
      const vJob = new VerificationJob(errorScrapers, coordinator);

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await vJob.verifyMarketplace('autotrack');

      expect(result.unknown).toBe(1);
      expect(result.errors).toBe(1);
    });
  });

  describe('marketplace recovery', () => {
    it('should record success when at least one verification succeeds', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await verificationJob.verifyMarketplace('autotrack');

      // Should call recordSuccess (which inserts/updates marketplace_health)
      const healthInserts = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('INSERT INTO marketplace_health') &&
          call[0].includes("'healthy'"),
      );
      expect(healthInserts.length).toBeGreaterThan(0);
    });

    it('should record failure when all verifications fail', async () => {
      const errorScraper = createMockScraper('autotrack', async () => {
        throw new Error('Connection refused');
      });
      const errorScrapers = new Map<MarketplaceId, MarketplaceScraper>([
        ['autotrack', errorScraper],
      ]);
      const vJob = new VerificationJob(errorScrapers, coordinator);

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health') && sql.includes("'degraded'")) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await vJob.verifyMarketplace('autotrack');

      // Should call recordFailure (which inserts marketplace_health with 'degraded')
      const healthInserts = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('INSERT INTO marketplace_health') &&
          call[0].includes("'degraded'"),
      );
      expect(healthInserts.length).toBe(1);
    });

    it('should trigger full collection when marketplace recovers from degraded state', async () => {
      // Simulate the coordinator returning 'degraded' health before verification
      const spy = vi.spyOn(coordinator, 'getMarketplaceHealth').mockResolvedValue({
        marketplace: 'autotrack',
        status: 'degraded',
        lastSuccessfulContact: new Date(Date.now() - 3600000),
        consecutiveFailures: 3,
        unreachableSince: new Date(Date.now() - 3600000),
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await verificationJob.verifyMarketplace('autotrack');

      // Should have added a recovery collection job to the queue
      expect(mockQueueAdd).toHaveBeenCalledWith(
        expect.stringContaining('collect-recovery-autotrack'),
        expect.objectContaining({
          marketplace: 'autotrack',
          scheduledAt: expect.any(String),
        }),
        expect.objectContaining({
          jobId: expect.stringContaining('collect-recovery-autotrack-'),
        }),
      );

      spy.mockRestore();
    });

    it('should trigger full collection when marketplace recovers from unreachable state', async () => {
      const spy = vi.spyOn(coordinator, 'getMarketplaceHealth').mockResolvedValue({
        marketplace: 'autotrack',
        status: 'unreachable',
        lastSuccessfulContact: new Date(Date.now() - 5 * 3600000),
        consecutiveFailures: 10,
        unreachableSince: new Date(Date.now() - 5 * 3600000),
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await verificationJob.verifyMarketplace('autotrack');

      // Should have added a recovery collection job
      expect(mockQueueAdd).toHaveBeenCalledWith(
        expect.stringContaining('collect-recovery-autotrack'),
        expect.objectContaining({ marketplace: 'autotrack' }),
        expect.any(Object),
      );

      spy.mockRestore();
    });

    it('should NOT trigger full collection when marketplace was already healthy', async () => {
      const spy = vi.spyOn(coordinator, 'getMarketplaceHealth').mockResolvedValue({
        marketplace: 'autotrack',
        status: 'healthy',
        lastSuccessfulContact: new Date(),
        consecutiveFailures: 0,
        unreachableSince: null,
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              {
                listing_id: 'listing-1',
                source_url: 'https://autotrack.nl/ad/1',
                marketplace: 'autotrack',
                source_reference_id: 'sr-1',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await verificationJob.verifyMarketplace('autotrack');

      // Should NOT have added a recovery collection job
      expect(mockQueueAdd).not.toHaveBeenCalledWith(
        expect.stringContaining('collect-recovery'),
        expect.any(Object),
        expect.any(Object),
      );

      spy.mockRestore();
    });
  });

  describe('empty marketplace', () => {
    it('should return zero counts when no active listings exist for the marketplace', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await verificationJob.verifyMarketplace('autotrack');

      expect(result.totalVerified).toBe(0);
      expect(result.active).toBe(0);
      expect(result.inactive).toBe(0);
      expect(result.unknown).toBe(0);
    });

    it('should not record success or failure when no listings to verify', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      await verificationJob.verifyMarketplace('autotrack');

      // Should not call recordSuccess or recordFailure (no INSERT INTO marketplace_health)
      const healthInserts = mockQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('INSERT INTO marketplace_health'),
      );
      expect(healthInserts.length).toBe(0);
    });
  });

  describe('mixed results', () => {
    it('should handle a mix of active, inactive, and unknown verifications', async () => {
      let callCount = 0;
      const mixedScraper = createMockScraper('autotrack', async (url: string) => {
        callCount++;
        if (url.includes('ad/1')) return 'active';
        if (url.includes('ad/2')) return 'inactive';
        return 'unknown';
      });
      const mixedScrapers = new Map<MarketplaceId, MarketplaceScraper>([
        ['autotrack', mixedScraper],
      ]);
      const vJob = new VerificationJob(mixedScrapers, coordinator);

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('marketplace_health')) {
          return { rows: [] };
        }
        if (sql.includes('FROM listings') && sql.includes('source_references')) {
          return {
            rows: [
              { listing_id: 'listing-1', source_url: 'https://autotrack.nl/ad/1', marketplace: 'autotrack', source_reference_id: 'sr-1' },
              { listing_id: 'listing-2', source_url: 'https://autotrack.nl/ad/2', marketplace: 'autotrack', source_reference_id: 'sr-2' },
              { listing_id: 'listing-3', source_url: 'https://autotrack.nl/ad/3', marketplace: 'autotrack', source_reference_id: 'sr-3' },
            ],
          };
        }
        if (sql.includes('COUNT')) {
          return { rows: [{ count: '0' }] };
        }
        if (sql.includes('INSERT INTO marketplace_health')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await vJob.verifyMarketplace('autotrack');

      expect(result.totalVerified).toBe(3);
      expect(result.active).toBe(1);
      expect(result.inactive).toBe(1);
      expect(result.unknown).toBe(1);
    });
  });
});
