import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarketplaceId, RawAdvertisement, ListingStatus } from '@car-ads/shared';
import type { MarketplaceScraper } from '../scraping/marketplace-scraper.js';

// --- Mocks ---

const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

vi.mock('../config/env.js', () => ({
  env: {
    DATABASE_URL: 'postgresql://localhost:5432/car_ads_test',
    REDIS_URL: 'redis://localhost:6379',
    PORT: 3000,
    NODE_ENV: 'test',
  },
}));

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

vi.mock('node-cron', () => ({
  default: { schedule: vi.fn().mockReturnValue({ stop: vi.fn() }) },
  schedule: vi.fn().mockReturnValue({ stop: vi.fn() }),
}));

import { AggregationPipeline } from '../scraping/aggregation-pipeline.js';
import { CurationEngine } from '../curation/curation-engine.js';
import { DeduplicationService } from '../deduplication/dedup-service.js';
import { ScraperCoordinator } from '../scraping/scraper-coordinator.js';
import { ReEvaluationJob } from '../curation/re-evaluation-job.js';

// --- Test Helpers ---

function createTestAd(overrides: Partial<RawAdvertisement> = {}): RawAdvertisement {
  return {
    title: 'Ferrari 488 GTB 2020',
    price: 250000,
    mileage: 15000,
    year: 2020,
    make: 'Ferrari',
    model: '488 GTB',
    engineDisplacementCc: 3902,
    horsepower: 670,
    location: 'Amsterdam',
    sellerType: 'dealer',
    sourceUrl: 'https://autotrack.nl/ferrari-488-12345',
    imageUrls: ['https://img.autotrack.nl/1.jpg', 'https://img.autotrack.nl/2.jpg'],
    transmissionType: 'automatic',
    fuelType: 'petrol',
    bodyType: null,
    ...overrides,
  };
}

function createMockScraper(
  marketplace: MarketplaceId,
  listings: RawAdvertisement[],
): MarketplaceScraper {
  return {
    collectListings: vi.fn().mockResolvedValue(listings),
    verifyListing: vi.fn().mockResolvedValue('active' as ListingStatus),
    getMarketplaceId: () => marketplace,
  };
}

// --- Integration Tests ---

describe('Integration: End-to-End Aggregation Flow', () => {
  let curationEngine: CurationEngine;
  let deduplicationService: DeduplicationService;
  let pipeline: AggregationPipeline;

  beforeEach(() => {
    vi.clearAllMocks();

    curationEngine = new CurationEngine();
    deduplicationService = new DeduplicationService();
    pipeline = new AggregationPipeline(curationEngine, deduplicationService);

    // Mock curation config load – provide luxury brands and exclusive models
    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      // CurationEngine.loadConfig() calls
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari', 'Lamborghini', 'Porsche', 'Bentley', 'Rolls-Royce'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [{ make: 'BMW', model: 'M5 CS' }, { make: 'Mercedes-Benz', model: 'AMG GT' }] }] };
      }
      // Default: empty rows
      return { rows: [], rowCount: 0 };
    });
  });

  it('should process qualifying ads through validate → curate → deduplicate → store', async () => {
    // Initialize curation engine (loads config from mocked DB)
    await curationEngine.initialize();

    // Set up DB mocks for the pipeline processing
    let insertedListings: unknown[][] = [];
    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      // Curation config load
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari', 'Lamborghini', 'Porsche', 'Bentley', 'Rolls-Royce'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [{ make: 'BMW', model: 'M5 CS' }] }] };
      }
      // Import attempt count check
      if (sql.includes('import_failures') && sql.includes('attempt_count')) {
        return { rows: [] };
      }
      // Dedup check – no existing listing
      if (sql.includes('FROM listings') && sql.includes('LOWER(make)')) {
        return { rows: [] };
      }
      // Insert listing
      if (sql.includes('INSERT INTO listings')) {
        insertedListings.push(params as unknown[]);
        return { rows: [{ id: `listing-${insertedListings.length}` }] };
      }
      // Insert source reference
      if (sql.includes('INSERT INTO source_references')) {
        return { rows: [], rowCount: 1 };
      }
      // Sound profile lookup
      if (sql.includes('sound_profiles')) {
        return { rows: [] };
      }
      return { rows: [], rowCount: 0 };
    });

    // Create a mock scraper with test advertisements
    const qualifyingAd = createTestAd(); // Ferrari with 670 HP – qualifies
    const scraper = createMockScraper('autotrack', [qualifyingAd]);

    // Simulate the full flow: scrape → pipeline
    const scrapedAds = await scraper.collectListings();
    const result = await pipeline.process(scrapedAds, 'autotrack');

    // Verify qualifying ad was inserted
    expect(result.totalProcessed).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.skippedCuration).toBe(0);
    expect(result.skippedValidation).toBe(0);

    // Verify the DB insert was called with correct data
    expect(insertedListings).toHaveLength(1);
    const insertParams = insertedListings[0];
    expect(insertParams[0]).toBe('Ferrari 488 GTB 2020'); // title
    expect(insertParams[1]).toBe(250000); // price
    expect(insertParams[4]).toBe('Ferrari'); // make
    expect(insertParams[5]).toBe('488 GTB'); // model
  });

  it('should discard ads that do not meet curation rules', async () => {
    await curationEngine.initialize();

    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari', 'Lamborghini', 'Porsche', 'Bentley', 'Rolls-Royce'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [{ make: 'BMW', model: 'M5 CS' }] }] };
      }
      if (sql.includes('import_failures') && sql.includes('attempt_count')) {
        return { rows: [] };
      }
      return { rows: [], rowCount: 0 };
    });

    // Non-qualifying ad: Toyota Corolla with 132 HP
    const nonQualifyingAd = createTestAd({
      title: 'Toyota Corolla 2021',
      make: 'Toyota',
      model: 'Corolla',
      horsepower: 132,
      price: 25000,
    });

    const result = await pipeline.process([nonQualifyingAd], 'autotrack');

    expect(result.totalProcessed).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.skippedCuration).toBe(1);
  });

  it('should skip ads with missing mandatory fields and log the failure', async () => {
    await curationEngine.initialize();

    let loggedFailure = false;
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [] }] };
      }
      if (sql.includes('import_failures') && sql.includes('SELECT')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO import_failures')) {
        loggedFailure = true;
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    // Ad missing price (mandatory field)
    const invalidAd = createTestAd({ price: null });

    const result = await pipeline.process([invalidAd], 'autotrack');

    expect(result.totalProcessed).toBe(1);
    expect(result.skippedValidation).toBe(1);
    expect(result.inserted).toBe(0);
    expect(loggedFailure).toBe(true);
  });

  it('should merge duplicates instead of inserting new listings', async () => {
    await curationEngine.initialize();

    let mergedSourceRef = false;
    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [] }] };
      }
      if (sql.includes('import_failures') && sql.includes('attempt_count')) {
        return { rows: [] };
      }
      // Dedup check – return existing listing (duplicate found)
      if (sql.includes('FROM listings') && sql.includes('LOWER(make)')) {
        return { rows: [{ id: 'existing-listing-1' }] };
      }
      // Merge source reference
      if (sql.includes('INSERT INTO source_references')) {
        mergedSourceRef = true;
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    // This ad is a duplicate of an existing listing
    const duplicateAd = createTestAd({
      sourceUrl: 'https://autoscout24.nl/ferrari-488-99999',
    });

    const result = await pipeline.process([duplicateAd], 'autoscout24');

    expect(result.totalProcessed).toBe(1);
    expect(result.merged).toBe(1);
    expect(result.inserted).toBe(0);
    expect(mergedSourceRef).toBe(true);
  });

  it('should handle a mixed batch: qualifying, non-qualifying, invalid, and duplicate ads', async () => {
    await curationEngine.initialize();

    let insertCount = 0;
    let mergeCount = 0;
    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari', 'Lamborghini'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [] }] };
      }
      if (sql.includes('import_failures') && sql.includes('SELECT')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO import_failures')) {
        return { rows: [], rowCount: 1 };
      }
      // Dedup check: second Ferrari is a duplicate
      if (sql.includes('FROM listings') && sql.includes('LOWER(make)')) {
        if (params && params[0] === 'Ferrari' && insertCount > 0) {
          return { rows: [{ id: 'existing-ferrari' }] };
        }
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO listings')) {
        insertCount++;
        return { rows: [{ id: `listing-${insertCount}` }] };
      }
      if (sql.includes('INSERT INTO source_references')) {
        if (insertCount === 0) mergeCount++;
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('sound_profiles')) {
        return { rows: [] };
      }
      return { rows: [], rowCount: 0 };
    });

    const ads: RawAdvertisement[] = [
      createTestAd(), // Qualifying Ferrari
      createTestAd({ make: 'Toyota', model: 'Yaris', horsepower: 100 }), // Non-qualifying
      createTestAd({ price: null }), // Invalid (missing mandatory field)
      createTestAd({ sourceUrl: 'https://other.nl/ferrari-488-dup' }), // Duplicate of first
    ];

    const result = await pipeline.process(ads, 'autotrack');

    expect(result.totalProcessed).toBe(4);
    expect(result.inserted).toBe(1);
    expect(result.skippedCuration).toBe(1);
    expect(result.skippedValidation).toBe(1);
    expect(result.merged).toBe(1);
  });
});

describe('Integration: Marketplace Health Flow', () => {
  let coordinator: ScraperCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    coordinator = new ScraperCoordinator();
  });

  it('should transition from healthy → degraded on failure', async () => {
    // Initially no marketplace health record
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

    await coordinator.recordFailure('autotrack');

    // Verify the upsert query was called with 'degraded' status
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('degraded'),
      ['autotrack'],
    );
  });

  it('should transition to unreachable status after 4 hours of failures', async () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000 - 1000); // 4h + 1s ago

    mockQueryOne.mockResolvedValue({
      marketplace: 'autotrack',
      status: 'degraded',
      last_successful_contact: null,
      consecutive_failures: 5,
      unreachable_since: fourHoursAgo,
      updated_at: new Date(),
    });

    const health = await coordinator.getMarketplaceHealth('autotrack');

    expect(health.status).toBe('unreachable');
    expect(health.consecutiveFailures).toBe(5);
    expect(health.unreachableSince).toEqual(fourHoursAgo);
  });

  it('should remain degraded when unreachable for less than 4 hours', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    mockQueryOne.mockResolvedValue({
      marketplace: 'autotrack',
      status: 'degraded',
      last_successful_contact: null,
      consecutive_failures: 3,
      unreachable_since: twoHoursAgo,
      updated_at: new Date(),
    });

    const health = await coordinator.getMarketplaceHealth('autotrack');

    expect(health.status).toBe('degraded');
    expect(health.consecutiveFailures).toBe(3);
  });

  it('should recover to healthy on recordSuccess and clear staleness', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

    await coordinator.recordSuccess('autotrack');

    // Verify the upsert query sets status to healthy and clears unreachable_since
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('healthy'),
      ['autotrack'],
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('unreachable_since = NULL'),
      ['autotrack'],
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('consecutive_failures = 0'),
      ['autotrack'],
    );
  });

  it('should return healthy with no contact history when no record exists', async () => {
    mockQueryOne.mockResolvedValue(null);

    const health = await coordinator.getMarketplaceHealth('autotrack');

    expect(health.status).toBe('healthy');
    expect(health.consecutiveFailures).toBe(0);
    expect(health.unreachableSince).toBeNull();
  });

  it('should support the full cycle: healthy → degraded → unreachable → recovery → healthy', async () => {
    // Step 1: Record failure → degraded
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    await coordinator.recordFailure('autotrack');

    const failureCall = mockQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO marketplace_health'),
    );
    expect(failureCall?.[0]).toContain('degraded');

    // Step 2: Check health after 4+ hours → unreachable
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    mockQueryOne.mockResolvedValue({
      marketplace: 'autotrack',
      status: 'degraded',
      last_successful_contact: null,
      consecutive_failures: 10,
      unreachable_since: fiveHoursAgo,
      updated_at: new Date(),
    });

    const healthUnreachable = await coordinator.getMarketplaceHealth('autotrack');
    expect(healthUnreachable.status).toBe('unreachable');

    // Step 3: Record success → healthy (recovery)
    mockQuery.mockClear();
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    await coordinator.recordSuccess('autotrack');

    const recoveryCall = mockQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('healthy'),
    );
    expect(recoveryCall).toBeDefined();
    expect(recoveryCall?.[0]).toContain('consecutive_failures = 0');
    expect(recoveryCall?.[0]).toContain('unreachable_since = NULL');
  });
});

describe('Integration: Curation Re-evaluation Flow', () => {
  let curationEngine: CurationEngine;
  let reEvaluationJob: ReEvaluationJob;

  beforeEach(() => {
    vi.clearAllMocks();
    curationEngine = new CurationEngine();
    reEvaluationJob = new ReEvaluationJob(curationEngine);
  });

  it('should mark listings inactive when they no longer qualify after brands update', async () => {
    // Initial state: Ferrari is in luxury brands, Porsche is also there
    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands') && sql.includes('SELECT')) {
        return { rows: [{ value: ['Ferrari', 'Porsche', 'Lamborghini', 'Bentley', 'Rolls-Royce'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models') && sql.includes('SELECT')) {
        return { rows: [{ value: [] }] };
      }
      return { rows: [], rowCount: 0 };
    });

    await curationEngine.initialize();

    // Now update luxury brands to REMOVE Ferrari
    let deactivatedListingIds: string[] = [];
    let updatedListingIds: string[] = [];

    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      // Config select for brands
      if (sql.includes('curation_config') && sql.includes('luxury_brands') && sql.includes('SELECT')) {
        // After update, return new list without Ferrari
        return { rows: [{ id: 'config-1' }] };
      }
      // Config update (brands)
      if (sql.includes('UPDATE curation_config') && sql.includes('luxury_brands')) {
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models') && sql.includes('SELECT')) {
        return { rows: [{ value: [] }] };
      }
      // loadConfig during reEvaluateAll – use updated brands (no Ferrari)
      if (sql.includes('curation_config') && sql.includes('luxury_brands') && !sql.includes('UPDATE')) {
        return { rows: [{ value: ['Porsche', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'Aston Martin'] }] };
      }
      // Active listings – Ferrari 488 with 200 HP (won't qualify without brand), Porsche 911 with 450 HP
      if (sql.includes('SELECT id, make, model, horsepower FROM listings')) {
        return {
          rows: [
            { id: 'listing-ferrari-1', make: 'Ferrari', model: '348', horsepower: 200 },
            { id: 'listing-porsche-1', make: 'Porsche', model: '911 Turbo', horsepower: 450 },
          ],
        };
      }
      // Deactivation (SET status = 'inactive')
      if (sql.includes("SET status = 'inactive'")) {
        deactivatedListingIds.push(params?.[0] as string);
        return { rows: [], rowCount: 1 };
      }
      // Criteria update
      if (sql.includes('SET curation_criteria')) {
        updatedListingIds.push(params?.[1] as string);
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    // Trigger re-evaluation with updated brands (Ferrari removed)
    const result = await reEvaluationJob.updateLuxuryBrandsAndReEvaluate([
      'Porsche', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'Aston Martin',
    ]);

    // Ferrari 348 with 200 HP should be deactivated (no longer qualifies – not luxury brand, HP < 300)
    expect(result.removedCount).toBe(1);
    expect(deactivatedListingIds).toContain('listing-ferrari-1');

    // Porsche 911 Turbo with 450 HP still qualifies (HP > 300)
    expect(result.updatedCount).toBe(1);
    expect(updatedListingIds).toContain('listing-porsche-1');
  });

  it('should update curation criteria for listings that still qualify after config change', async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands') && sql.includes('SELECT')) {
        return { rows: [{ value: ['Ferrari', 'Porsche', 'Lamborghini', 'Bentley', 'Rolls-Royce'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models') && sql.includes('SELECT')) {
        return { rows: [{ value: [{ make: 'BMW', model: 'M5 CS' }] }] };
      }
      return { rows: [], rowCount: 0 };
    });

    await curationEngine.initialize();

    let updatedCriteria: { id: string; criteria: unknown }[] = [];

    mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
      // updateLuxuryBrands: SELECT id to check if config exists
      if (sql.includes('SELECT id FROM curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ id: 'config-1' }] };
      }
      // updateLuxuryBrands: UPDATE the value
      if (sql.includes('UPDATE curation_config') && sql.includes('luxury_brands')) {
        return { rows: [], rowCount: 1 };
      }
      // loadConfig during reEvaluateAll: SELECT value – now returns updated brands with BMW
      if (sql.includes('SELECT value FROM curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari', 'Porsche', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'BMW'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [{ make: 'BMW', model: 'M5 CS' }] }] };
      }
      // Active listings – BMW M5 CS that now qualifies via brand AND exclusive model AND HP
      if (sql.includes('SELECT id, make, model, horsepower FROM listings')) {
        return {
          rows: [
            { id: 'listing-bmw-1', make: 'BMW', model: 'M5 CS', horsepower: 635 },
          ],
        };
      }
      // Criteria update
      if (sql.includes('SET curation_criteria')) {
        updatedCriteria.push({ id: params?.[1] as string, criteria: params?.[0] });
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    const result = await reEvaluationJob.updateLuxuryBrandsAndReEvaluate([
      'Ferrari', 'Porsche', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'BMW',
    ]);

    expect(result.removedCount).toBe(0);
    expect(result.updatedCount).toBe(1);

    // BMW M5 CS should have multiple criteria (HP > 300, luxury brand, exclusive model)
    const bmwUpdate = updatedCriteria.find((u) => u.id === 'listing-bmw-1');
    expect(bmwUpdate).toBeDefined();
    const criteria = bmwUpdate!.criteria as string[];
    expect(criteria).toContain('hp_above_300');
    expect(criteria).toContain('luxury_brand_match');
    expect(criteria).toContain('exclusive_model_match');
  });

  it('should prevent concurrent re-evaluation runs', async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [] }] };
      }
      if (sql.includes('SELECT id, make, model, horsepower FROM listings')) {
        return { rows: [] };
      }
      return { rows: [], rowCount: 0 };
    });

    await curationEngine.initialize();

    // Start first re-evaluation (will complete quickly since no listings)
    const firstRun = reEvaluationJob.trigger('luxury_brands_update');

    // Attempt second run while first is running — should throw
    await expect(reEvaluationJob.trigger('luxury_brands_update')).rejects.toThrow(
      'Re-evaluation job is already running.',
    );

    await firstRun;
  });

  it('should track the last result after completion', async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('curation_config') && sql.includes('luxury_brands')) {
        return { rows: [{ value: ['Ferrari'] }] };
      }
      if (sql.includes('curation_config') && sql.includes('exclusive_models')) {
        return { rows: [{ value: [] }] };
      }
      if (sql.includes('SELECT id, make, model, horsepower FROM listings')) {
        return {
          rows: [
            { id: 'listing-1', make: 'Ferrari', model: 'F40', horsepower: 478 },
          ],
        };
      }
      if (sql.includes('SET curation_criteria')) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    await curationEngine.initialize();

    expect(reEvaluationJob.getLastResult()).toBeNull();

    const result = await reEvaluationJob.trigger('luxury_brands_update');

    expect(reEvaluationJob.getLastResult()).toEqual(result);
    expect(result.trigger).toBe('luxury_brands_update');
    expect(result.totalEvaluated).toBe(1);
    expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(result.triggeredAt.getTime());
  });
});
