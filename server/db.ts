/**
 * Database Connection Module
 *
 * Provides PostgreSQL connection pool with production-ready settings.
 * Junior-Friendly: ~30 lines, clear configuration
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { logError } from './lib/logger';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Connection pool configuration
 * Optimized for production workloads
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pool size limits
  max: 20, // Maximum connections in pool
  min: 0, // Don't keep minimum connections (Neon closes idle ones)
  // Timeouts (ms)
  idleTimeoutMillis: 10000, // Close idle connections after 10s (before Neon does)
  connectionTimeoutMillis: 5000, // Fail if can't connect in 5s
  // Statement timeout (prevent runaway queries)
  statement_timeout: 30000, // 30s max query time
});

/**
 * Handle pool errors gracefully
 * Neon serverless DB closes idle connections - this prevents server crash
 */
pool.on('error', (err) => {
  logError('[DB Pool] Unexpected error on idle client', err);
  // Don't exit - pool will create new connections as needed
});

export const db = drizzle(pool, { schema });
