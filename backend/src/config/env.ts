/**
 * Environment configuration module.
 * Reads from process.env with sensible defaults for local development.
 */

export interface EnvConfig {
  DATABASE_URL: string;
  REDIS_URL: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
}

export function loadEnvConfig(): EnvConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/car_ads',
    REDIS_URL: process.env.REDIS_URL ?? '',
    PORT: parseInt(process.env.PORT ?? '4000', 10),
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) ?? 'development',
  };
}

export const env = loadEnvConfig();
