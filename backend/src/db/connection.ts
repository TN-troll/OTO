import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a parameterized query against the connection pool.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Get a single row or null from a parameterized query.
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

/**
 * Gracefully shut down the pool (call on process exit).
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
