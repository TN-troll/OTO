import { env } from '../config/env.js';

export type RedisClient = any;

let client: any = null;

/**
 * Create and connect the Redis client.
 * Returns null if REDIS_URL is not configured.
 */
export async function connectRedis(): Promise<RedisClient | null> {
  if (!env.REDIS_URL || env.REDIS_URL === 'redis://localhost:6379') {
    // Skip Redis in environments where it's not available
    return null;
  }

  if (client) return client;

  try {
    const { createClient } = await import('redis');
    client = createClient({ url: env.REDIS_URL });
    client.on('error', (err: Error) => {
      console.error('Redis client error:', err.message);
    });
    await client.connect();
    return client;
  } catch (err) {
    console.warn('[OTO] Redis not available, running without cache');
    return null;
  }
}

/**
 * Get the current Redis client instance.
 * Returns null if Redis is not connected (graceful degradation).
 */
export function getRedisClient(): RedisClient | null {
  return client;
}

/**
 * Gracefully disconnect the Redis client.
 */
export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
