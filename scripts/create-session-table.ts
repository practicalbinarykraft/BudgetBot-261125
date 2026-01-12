/**
 * Create Session Table
 * Creates the session table required by express-session with connect-pg-simple
 */

import { Pool } from 'pg';

// Use DATABASE_URL from environment or fallback to localhost
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/budget_bot';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set, using default localhost connection');
}

const pool = new Pool({ connectionString: DB_URL });

async function createSessionTable() {
  console.log('🚀 Creating session table...\n');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
  `;

  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `;

  try {
    await pool.query(createTableSQL);
    console.log('✅ Session table created');

    await pool.query(createIndexSQL);
    console.log('✅ Session index created');

    console.log('\n✅ Session table setup complete!');
  } catch (error: any) {
    console.error('❌ Error creating session table:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSessionTable();
