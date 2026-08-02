import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import cron from 'node-cron';
import type { MarketplaceId, MarketplaceHealth, MarketplaceStatus } from '@car-ads/shared';
import {
  MARKETPLACE_RETRY_MAX_ATTEMPTS,
  MARKETPLACE_RETRY_INITIAL_DELAY_MS,
  MARKETPLACE_UNREACHABLE_THRESHOLD_MS,
} from '@car-ads/shared';
import { query, queryOne } from '../db/connection.js';
import { env } from '../config/env.js';

/** BullMQ connection options derived from environment config. */
const redisConnection = { url: env.REDIS_URL };

/** Payload for a collection job enqueued into BullMQ. */
export interface CollectionJobData {
  marketplace: MarketplaceId;
  scheduledAt: string;
}

/** Payload for a verification job enqueued into BullMQ. */
export interface VerificationJobData {
  marketplace: MarketplaceId;
  scheduledAt: string;
}

/** Row shape from the marketplace_health table. */
interface MarketplaceHealthRow {
  marketplace: string;
  status: MarketplaceStatus;
  last_successful_contact: Date | null;
  consecutive_failures: number;
  unreachable_since: Date | null;
  updated_at: Date;
}

/**
 * ScraperCoordinator manages scheduling and orchestration of all scraping jobs.
 *
 * - Uses BullMQ queues for collection and verification jobs.
 * - Uses node-cron to trigger jobs on a fixed schedule.
 * - Tracks marketplace health in PostgreSQL.
 * - Implements retry logic with exponential backoff.
 * - Detects 4-hour unreachable threshold.
 */
export class ScraperCoordinator {
  private collectionQueue: Queue<CollectionJobData>;
  private verificationQueue: Queue<VerificationJobData>;
  private cronJobs: cron.ScheduledTask[] = [];

  constructor() {
    this.collectionQueue = new Queue<CollectionJobData>('collection-jobs', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: MARKETPLACE_RETRY_MAX_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: MARKETPLACE_RETRY_INITIAL_DELAY_MS,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    this.verificationQueue = new Queue<VerificationJobData>('verification-jobs', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: MARKETPLACE_RETRY_MAX_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: MARKETPLACE_RETRY_INITIAL_DELAY_MS,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  /**
   * Schedule a collection job for the given marketplace.
   * Uses node-cron to enqueue a BullMQ job every 30 minutes.
   */
  scheduleCollection(marketplace: MarketplaceId): void {
    // Cron expression: every 30 minutes
    const task = cron.schedule('*/30 * * * *', async () => {
      await this.collectionQueue.add(
        `collect-${marketplace}`,
        {
          marketplace,
          scheduledAt: new Date().toISOString(),
        },
        { jobId: `collect-${marketplace}-${Date.now()}` },
      );
    });

    this.cronJobs.push(task);
  }

  /**
   * Schedule a verification job for the given marketplace.
   * Uses node-cron to enqueue a BullMQ job every 60 minutes.
   */
  scheduleVerification(marketplace: MarketplaceId): void {
    // Cron expression: every 60 minutes (on the hour)
    const task = cron.schedule('0 * * * *', async () => {
      await this.verificationQueue.add(
        `verify-${marketplace}`,
        {
          marketplace,
          scheduledAt: new Date().toISOString(),
        },
        { jobId: `verify-${marketplace}-${Date.now()}` },
      );
    });

    this.cronJobs.push(task);
  }

  /**
   * Retrieve the current health status for a marketplace.
   * Computes 'unreachable' status if the marketplace has been down > 4 hours.
   */
  async getMarketplaceHealth(marketplace: MarketplaceId): Promise<MarketplaceHealth> {
    const row = await queryOne<MarketplaceHealthRow>(
      `SELECT marketplace, status, last_successful_contact, consecutive_failures, unreachable_since, updated_at
       FROM marketplace_health
       WHERE marketplace = $1`,
      [marketplace],
    );

    if (!row) {
      // No record yet – treat as healthy with no contact history
      return {
        marketplace,
        status: 'healthy',
        lastSuccessfulContact: new Date(),
        consecutiveFailures: 0,
        unreachableSince: null,
      };
    }

    // Determine effective status based on the 4-hour unreachable threshold
    let effectiveStatus: MarketplaceStatus = row.status;
    if (row.unreachable_since) {
      const unreachableDuration = Date.now() - new Date(row.unreachable_since).getTime();
      if (unreachableDuration >= MARKETPLACE_UNREACHABLE_THRESHOLD_MS) {
        effectiveStatus = 'unreachable';
      }
    }

    return {
      marketplace: row.marketplace as MarketplaceId,
      status: effectiveStatus,
      lastSuccessfulContact: row.last_successful_contact ?? new Date(0),
      consecutiveFailures: row.consecutive_failures,
      unreachableSince: row.unreachable_since,
    };
  }

  /**
   * Retry a previously failed job by its ID.
   * Attempts to retry in the collection queue first, then verification queue.
   */
  async retryFailed(jobId: string): Promise<void> {
    // Try collection queue first
    let job = await this.collectionQueue.getJob(jobId);
    if (job) {
      await job.retry();
      return;
    }

    // Try verification queue
    job = await this.verificationQueue.getJob(jobId);
    if (job) {
      await job.retry();
      return;
    }

    throw new Error(`Job with ID "${jobId}" not found in any queue.`);
  }

  /**
   * Record a successful contact with a marketplace.
   * Resets failure counters and clears unreachable_since if previously unreachable.
   */
  async recordSuccess(marketplace: MarketplaceId): Promise<void> {
    await query(
      `INSERT INTO marketplace_health (marketplace, status, last_successful_contact, consecutive_failures, unreachable_since, updated_at)
       VALUES ($1, 'healthy', NOW(), 0, NULL, NOW())
       ON CONFLICT (marketplace) DO UPDATE SET
         status = 'healthy',
         last_successful_contact = NOW(),
         consecutive_failures = 0,
         unreachable_since = NULL,
         updated_at = NOW()`,
      [marketplace],
    );
  }

  /**
   * Record a failed contact attempt with a marketplace.
   * Increments failure counter and sets unreachable_since on first failure.
   * Sets status to 'degraded' on first failures, stays degraded until 4-hour threshold
   * is checked via getMarketplaceHealth().
   */
  async recordFailure(marketplace: MarketplaceId): Promise<void> {
    await query(
      `INSERT INTO marketplace_health (marketplace, status, last_successful_contact, consecutive_failures, unreachable_since, updated_at)
       VALUES ($1, 'degraded', NULL, 1, NOW(), NOW())
       ON CONFLICT (marketplace) DO UPDATE SET
         status = 'degraded',
         consecutive_failures = marketplace_health.consecutive_failures + 1,
         unreachable_since = COALESCE(marketplace_health.unreachable_since, NOW()),
         updated_at = NOW()`,
      [marketplace],
    );
  }

  /**
   * Get the BullMQ collection queue (for worker attachment).
   */
  getCollectionQueue(): Queue<CollectionJobData> {
    return this.collectionQueue;
  }

  /**
   * Get the BullMQ verification queue (for worker attachment).
   */
  getVerificationQueue(): Queue<VerificationJobData> {
    return this.verificationQueue;
  }

  /**
   * Stop all cron jobs and close queues. Call on graceful shutdown.
   */
  async shutdown(): Promise<void> {
    for (const task of this.cronJobs) {
      task.stop();
    }
    this.cronJobs = [];
    await this.collectionQueue.close();
    await this.verificationQueue.close();
  }
}
