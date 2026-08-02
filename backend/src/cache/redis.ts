import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env.js';

export type RedisClient = RedisClientType;

let client: RedisClient | null = null;

/**
 * Create and connect the Redis client.
 * Re-uses an existing connection if already connected.
 */
export async function connectRedis(): Promise<RedisClient> {
  if (client) {
    return client;
  }

  client = createClient({ url: env.REDIS_URL }) as RedisClient;

  client.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  await client.connect();
  return client;
}

/**
 * Get the current Redis client instance.
 * Throws if connect has not been called yet.
 */
export function getRedisClient(): RedisClient {
  if (!client) {
    throw new Error('Redis client not connected. Call connectRedis() first.');
  }
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
