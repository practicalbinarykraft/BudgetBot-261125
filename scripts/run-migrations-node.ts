/**
 * Run migrations using Node.js (no psql required)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../server/db.js';

const migrations = [
  '0003_create_admin_users.sql',
  '0004_create_admin_audit_log.sql',
  '0005_create_broadcasts.sql',
  '0006_create_support_chats.sql',
];

const migrationsDir = join(process.cwd(), 'migrations');

async function runMigration(filename: string): Promise<void> {
  const filePath = join(migrationsDir, filename);
  
  console.log(`\n📄 Running migration: ${filename}`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Execute SQL using drizzle
    await db.execute(sql);
    
    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error: any) {
    // If table already exists, that's OK
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`⚠️  Table already exists, skipping...`);
      return;
    }
    
    console.error(`❌ Error running migration ${filename}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting admin panel migrations...\n');
  console.log(`Migrations directory: ${migrationsDir}`);
  console.log(`Total migrations: ${migrations.length}\n`);
  
  for (const migration of migrations) {
    try {
      await runMigration(migration);
    } catch (error: any) {
      console.error(`\n❌ Failed to run migration ${migration}`);
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All migrations completed successfully!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

