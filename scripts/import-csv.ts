/**
 * CSV Import Script
 * Imports CSV data from ~/Downloads/BD budget bot/ to database
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Use DATABASE_URL from environment or fallback to localhost
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/budget_bot';
const CSV_DIR = path.join(process.env.HOME!, 'Downloads', 'BD budget bot');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set, using default localhost connection');
}

const pool = new Pool({ connectionString: DB_URL });

// Order matters - tables with foreign keys must be imported after their dependencies
const TABLES = [
  'users',
  'settings',
  'categories',
  'wallets',
  'transactions',
  'budgets',
  'recurring',
  'planned_transactions',
  'planned_income',
  'assets',
  'asset_valuations',
  'calibrations',
  'personal_tags',
  'merchant_categories',
  'product_catalog',
  'product_price_history',
  'price_search_reports',
  'receipt_items',
  'wishlist',
  'telegram_verification_codes',
  'ai_chat_messages',
  'ai_tool_executions',
  'ai_training_examples',
  'sorting_sessions',
  'sorting_progress',
];

async function importTable(tableName: string) {
  const csvPath = path.join(CSV_DIR, `${tableName}.csv`);

  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  Skipping ${tableName} (file not found)`);
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    escape: '"',
    quote: '"',
  });

  if (records.length === 0) {
    console.log(`⏭️  Skipping ${tableName} (empty file)`);
    return 0;
  }

  console.log(`📥 Importing ${tableName} (${records.length} rows)...`);

  // Get column names from first record
  const columns = Object.keys(records[0]);

  // Build INSERT query
  const placeholders = records.map((_, rowIndex) => {
    const rowPlaceholders = columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ');
    return `(${rowPlaceholders})`;
  }).join(', ');

  const query = `INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders}`;

  // Flatten all values
  const values = records.flatMap(record =>
    columns.map(col => {
      const value = record[col];
      // Handle empty strings as NULL
      if (value === '' || value === '""' || value === 'null') return null;
      // Remove extra quotes
      if (typeof value === 'string' && value.startsWith('"""') && value.endsWith('"""')) {
        return value.slice(3, -3);
      }
      return value;
    })
  );

  try {
    await pool.query(query, values);
    console.log(`✅ Imported ${tableName} (${records.length} rows)`);
    return records.length;
  } catch (error: any) {
    console.error(`❌ Error importing ${tableName}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting CSV import to database...\n');

  let totalRows = 0;

  for (const table of TABLES) {
    const rows = await importTable(table);
    totalRows += rows;
  }

  console.log('\n🎉 CSV import completed!');
  console.log(`📊 Total rows imported: ${totalRows}\n`);

  // Verify counts
  console.log('📊 Checking row counts...');
  for (const table of TABLES) {
    try {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      if (count > 0) {
        console.log(`  ${table}: ${count} rows`);
      }
    } catch (error) {
      // Table might not exist
    }
  }

  console.log('\n✅ Import verification complete!');

  await pool.end();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
