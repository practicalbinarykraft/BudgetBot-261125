import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const migrationSQL = readFileSync(
      join(__dirname, '../server/migrations/0005-add-telegram-fields.sql'),
      'utf-8'
    );

    console.log('🔧 Applying Telegram fields migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();

