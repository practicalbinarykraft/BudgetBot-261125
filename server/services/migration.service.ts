/**
 * Migration Service - Database Migration Management
 *
 * Junior-Friendly Guide:
 * =====================
 * This service tracks which SQL migrations have been applied to the database.
 * It creates a `_migrations` table to store migration history.
 *
 * Migration file naming:
 *   NNNN-description.sql (e.g., 0001-add-encrypted-api-keys.sql)
 *
 * Usage:
 *   import { migrationService } from './migration.service';
 *   await migrationService.runPending();
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../lib/logger';

// ========================================
// TYPES
// ========================================

export interface Migration {
  id: number;
  name: string;
  appliedAt: Date;
  checksum: string;
}

export interface MigrationFile {
  name: string;
  path: string;
  checksum: string;
}

export interface MigrationResult {
  success: boolean;
  applied: string[];
  failed: string | null;
  error?: string;
}

// ========================================
// CONSTANTS
// ========================================

const MIGRATIONS_DIR = path.join(process.cwd(), 'server', 'migrations');
const MIGRATION_TABLE = '_migrations';

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Generate a simple checksum for migration content
 * Used to detect if a migration file was modified after being applied
 */
function generateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Parse migration name to extract the number prefix
 * e.g., "0001-add-users.sql" -> 1
 */
function getMigrationOrder(name: string): number {
  const match = name.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : Infinity;
}

// ========================================
// MIGRATION SERVICE
// ========================================

class MigrationService {
  private initialized = false;

  /**
   * Ensure migrations table exists
   */
  async ensureTable(): Promise<void> {
    if (this.initialized) return;

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.raw(MIGRATION_TABLE)} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
        checksum VARCHAR(16) NOT NULL
      )
    `);

    this.initialized = true;
    logger.debug('Migration table initialized');
  }

  /**
   * Get list of applied migrations from database
   */
  async getApplied(): Promise<Migration[]> {
    await this.ensureTable();

    const result = await db.execute<{
      id: number;
      name: string;
      applied_at: Date;
      checksum: string;
    }>(sql`
      SELECT id, name, applied_at, checksum
      FROM ${sql.raw(MIGRATION_TABLE)}
      ORDER BY id ASC
    `);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      appliedAt: row.applied_at,
      checksum: row.checksum,
    }));
  }

  /**
   * Get list of migration files from disk
   */
  getMigrationFiles(): MigrationFile[] {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      logger.warn(`Migrations directory not found: ${MIGRATIONS_DIR}`);
      return [];
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => getMigrationOrder(a) - getMigrationOrder(b));

    return files.map(name => {
      const filePath = path.join(MIGRATIONS_DIR, name);
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        name,
        path: filePath,
        checksum: generateChecksum(content),
      };
    });
  }

  /**
   * Get pending migrations (not yet applied)
   */
  async getPending(): Promise<MigrationFile[]> {
    const applied = await this.getApplied();
    const appliedNames = new Set(applied.map(m => m.name));
    const files = this.getMigrationFiles();

    return files.filter(f => !appliedNames.has(f.name));
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: MigrationFile): Promise<void> {
    const content = fs.readFileSync(migration.path, 'utf-8');

    logger.info(`Applying migration: ${migration.name}`);

    // Execute the SQL
    await db.execute(sql.raw(content));

    // Record in migrations table
    await db.execute(sql`
      INSERT INTO ${sql.raw(MIGRATION_TABLE)} (name, checksum)
      VALUES (${migration.name}, ${migration.checksum})
    `);

    logger.info(`✅ Migration applied: ${migration.name}`);
  }

  /**
   * Run all pending migrations
   */
  async runPending(): Promise<MigrationResult> {
    await this.ensureTable();

    const pending = await this.getPending();
    const applied: string[] = [];

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return { success: true, applied: [], failed: null };
    }

    logger.info(`Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      try {
        await this.applyMigration(migration);
        applied.push(migration.name);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Migration failed: ${migration.name}`, { error: errorMessage });
        return {
          success: false,
          applied,
          failed: migration.name,
          error: errorMessage,
        };
      }
    }

    return { success: true, applied, failed: null };
  }

  /**
   * Get migration status summary
   */
  async getStatus(): Promise<{
    applied: number;
    pending: number;
    files: Array<{ name: string; status: 'applied' | 'pending'; appliedAt?: Date }>;
  }> {
    await this.ensureTable();

    const applied = await this.getApplied();
    const files = this.getMigrationFiles();
    const appliedMap = new Map(applied.map(m => [m.name, m]));

    const fileStatuses = files.map(f => {
      const appliedMigration = appliedMap.get(f.name);
      return {
        name: f.name,
        status: appliedMigration ? 'applied' as const : 'pending' as const,
        appliedAt: appliedMigration?.appliedAt,
      };
    });

    // Add any applied migrations not in files (orphaned)
    for (const m of applied) {
      if (!files.find(f => f.name === m.name)) {
        fileStatuses.push({
          name: m.name,
          status: 'applied',
          appliedAt: m.appliedAt,
        });
      }
    }

    return {
      applied: applied.length,
      pending: files.length - applied.length,
      files: fileStatuses.sort((a, b) => getMigrationOrder(a.name) - getMigrationOrder(b.name)),
    };
  }

  /**
   * Validate checksums of applied migrations
   * Returns migrations where file changed after being applied
   */
  async validateChecksums(): Promise<{ name: string; expected: string; actual: string }[]> {
    const applied = await this.getApplied();
    const files = this.getMigrationFiles();
    const fileMap = new Map(files.map(f => [f.name, f]));

    const mismatches: { name: string; expected: string; actual: string }[] = [];

    for (const migration of applied) {
      const file = fileMap.get(migration.name);
      if (file && file.checksum !== migration.checksum) {
        mismatches.push({
          name: migration.name,
          expected: migration.checksum,
          actual: file.checksum,
        });
      }
    }

    return mismatches;
  }

  /**
   * Create a new migration file with timestamp
   */
  createMigration(name: string): string {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }

    // Get next migration number
    const files = this.getMigrationFiles();
    const maxNum = files.reduce((max, f) => {
      const num = getMigrationOrder(f.name);
      return num > max ? num : max;
    }, 0);

    const nextNum = String(maxNum + 1).padStart(4, '0');
    const fileName = `${nextNum}-${name}.sql`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Write your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field TEXT;

`;

    fs.writeFileSync(filePath, template);
    logger.info(`Created migration: ${fileName}`);

    return fileName;
  }
}

// Export singleton instance
export const migrationService = new MigrationService();

// Export for testing
export { MigrationService, generateChecksum, getMigrationOrder };
