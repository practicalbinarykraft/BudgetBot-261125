/**
 * Run Admin Panel Migrations
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот скрипт запускает все миграции для админ-панели.
 * 
 * Использование:
 *   npm run tsx scripts/run-admin-migrations.ts
 * 
 * Или через ts-node:
 *   npx ts-node scripts/run-admin-migrations.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const migrations = [
  '0003_create_admin_users.sql',
  '0004_create_admin_audit_log.sql',
  '0005_create_broadcasts.sql',
  '0006_create_support_chats.sql',
];

const migrationsDir = join(process.cwd(), 'migrations');

function runMigration(filename: string): void {
  const filePath = join(migrationsDir, filename);
  
  console.log(`\n📄 Running migration: ${filename}`);
  
  try {
    // Проверяем что файл существует
    const sql = readFileSync(filePath, 'utf-8');
    
    // Получаем DATABASE_URL из переменных окружения
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Запускаем миграцию через psql
    execSync(`psql "${databaseUrl}" -f "${filePath}"`, {
      stdio: 'inherit',
      env: { ...process.env },
    });
    
    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error: any) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    
    // Если таблица уже существует, это не критично
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`⚠️  Table already exists, skipping...`);
      return;
    }
    
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting admin panel migrations...\n');
  console.log(`Migrations directory: ${migrationsDir}`);
  console.log(`Total migrations: ${migrations.length}\n`);
  
  for (const migration of migrations) {
    try {
      runMigration(migration);
    } catch (error: any) {
      console.error(`\n❌ Failed to run migration ${migration}`);
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All migrations completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Create first admin: npm run tsx scripts/create-admin.ts');
  console.log('   2. Test admin login at /app/admin/auth/login');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

