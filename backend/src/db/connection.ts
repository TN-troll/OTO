import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: { rejectUnauthorized: false },
};

console.log(`[OTO] DB connecting to: ${env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[OTO] Unexpected error on idle PostgreSQL client', err.message);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
