/**
 * Database Connection Module
 *
 * Provides PostgreSQL connection pool with production-ready settings.
 * Junior-Friendly: ~30 lines, clear configuration
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

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
  min: 2, // Minimum connections to keep open
  // Timeouts (ms)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail if can't connect in 5s
  // Statement timeout (prevent runaway queries)
  statement_timeout: 30000, // 30s max query time
});

export const db = drizzle(pool, { schema });
