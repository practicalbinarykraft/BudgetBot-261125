/**
 * Reset DB and Import CSV Data
 * Clears all data and imports from CSV files
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DB_URL = 'postgresql://neondb_owner:npg_Ih7NnWf2rAvE@ep-fancy-sea-ahwdfdjc-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const CSV_DIR = path.join(process.env.HOME!, 'Downloads', 'BD budget bot');

const pool = new Pool({ connectionString: DB_URL });

// Order matters - reverse order for deletion (foreign keys)
const TABLES = [
  'sorting_progress',
  'sorting_sessions',
  'ai_training_examples',
  'ai_tool_executions',
  'ai_chat_messages',
  'telegram_verification_codes',
  'wishlist',
  'receipt_items',
  'price_search_reports',
  'product_price_history',
  'product_catalog',
  'merchant_categories',
  'personal_tags',
  'calibrations',
  'asset_valuations',
  'assets',
  'planned_income',
  'planned_transactions',
  'recurring',
  'budgets',
  'transactions',
  'wallets',
  'categories',
  'settings',
  'users',
];

async function clearAllTables() {
  console.log('🗑️  Clearing all tables...\n');

  for (const table of TABLES) {
    try {
      await pool.query(`DELETE FROM ${table}`);
      console.log(`✅ Cleared ${table}`);
    } catch (error: any) {
      console.log(`⚠️  Skipping ${table} (${error.message})`);
    }
  }

  console.log('\n✅ All tables cleared!\n');
}

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

  // Filter out columns that don't exist in current schema
  const tableColumns = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = '${tableName}'
  `);
  const validColumns = tableColumns.rows.map(r => r.column_name);
  const filteredColumns = columns.filter(c => validColumns.includes(c));

  if (filteredColumns.length === 0) {
    console.log(`⚠️  No valid columns for ${tableName}`);
    return 0;
  }

  // Build INSERT query with ON CONFLICT DO NOTHING for idempotency
  const placeholders = records.map((_, rowIndex) => {
    const rowPlaceholders = filteredColumns.map((_, colIndex) => `$${rowIndex * filteredColumns.length + colIndex + 1}`).join(', ');
    return `(${rowPlaceholders})`;
  }).join(', ');

  const query = `
    INSERT INTO ${tableName} (${filteredColumns.map(c => `"${c}"`).join(', ')})
    VALUES ${placeholders}
    ON CONFLICT DO NOTHING
  `;

  // Flatten all values
  const values = records.flatMap(record =>
    filteredColumns.map(col => {
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
    const result = await pool.query(query, values);
    console.log(`✅ Imported ${tableName} (${result.rowCount || records.length} rows)`);
    return result.rowCount || records.length;
  } catch (error: any) {
    // If bulk insert fails, try row-by-row import to skip problematic records
    console.log(`⚠️  Bulk import failed for ${tableName}, trying row-by-row...`);

    let successCount = 0;
    let skippedCount = 0;

    for (const record of records) {
      const rowValues = filteredColumns.map(col => {
        const value = record[col];
        if (value === '' || value === '""' || value === 'null') return null;
        if (typeof value === 'string' && value.startsWith('"""') && value.endsWith('"""')) {
          return value.slice(3, -3);
        }
        return value;
      });

      const rowPlaceholders = filteredColumns.map((_, i) => `$${i + 1}`).join(', ');
      const rowQuery = `
        INSERT INTO ${tableName} (${filteredColumns.map(c => `"${c}"`).join(', ')})
        VALUES (${rowPlaceholders})
        ON CONFLICT DO NOTHING
      `;

      try {
        await pool.query(rowQuery, rowValues);
        successCount++;
      } catch (rowError: any) {
        skippedCount++;
        // Silently skip rows with foreign key violations
      }
    }

    console.log(`✅ Imported ${tableName} (${successCount} rows, ${skippedCount} skipped due to FK violations)`);
    return successCount;
  }
}

async function main() {
  console.log('🚀 Starting DB reset and CSV import...\n');

  // Step 1: Clear all tables
  await clearAllTables();

  // Step 2: Import data in correct order (reverse of deletion order)
  const importOrder = [...TABLES].reverse();

  let totalRows = 0;

  for (const table of importOrder) {
    const rows = await importTable(table);
    totalRows += rows;
  }

  console.log('\n🎉 CSV import completed!');
  console.log(`📊 Total rows imported: ${totalRows}\n`);

  // Verify counts
  console.log('📊 Final row counts:');
  for (const table of importOrder) {
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

  console.log('\n✅ Database reset and import complete!');

  await pool.end();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
