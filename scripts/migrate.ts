#!/usr/bin/env npx tsx
/**
 * Migration CLI - Database Migration Runner
 *
 * Junior-Friendly Guide:
 * =====================
 * This script manages database migrations from the command line.
 *
 * Commands:
 *   npx tsx scripts/migrate.ts status    - Show migration status
 *   npx tsx scripts/migrate.ts run       - Run pending migrations
 *   npx tsx scripts/migrate.ts create    - Create new migration file
 *   npx tsx scripts/migrate.ts validate  - Validate checksums
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *
 * Examples:
 *   DATABASE_URL="postgres://..." npm run db:migrate
 *   DATABASE_URL="postgres://..." npm run db:migrate:status
 *   npm run db:migrate:create add-user-avatar
 */

import { migrationService } from '../server/services/migration.service';

// ========================================
// HELPERS
// ========================================

function printHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   BudgetBot Migration CLI                      ║
╚═══════════════════════════════════════════════════════════════╝

Usage: npx tsx scripts/migrate.ts <command> [options]

Commands:
  status     Show migration status (applied/pending)
  run        Run all pending migrations
  create     Create a new migration file
  validate   Check if applied migrations were modified

Examples:
  npx tsx scripts/migrate.ts status
  npx tsx scripts/migrate.ts run
  npx tsx scripts/migrate.ts create add-user-preferences
  npx tsx scripts/migrate.ts validate

Environment:
  DATABASE_URL - Required PostgreSQL connection string

npm scripts:
  npm run db:migrate          - Run pending migrations
  npm run db:migrate:status   - Show migration status
  npm run db:migrate:create   - Create new migration (pass name as arg)
`);
}

function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

// ========================================
// COMMANDS
// ========================================

async function showStatus(): Promise<void> {
  console.log('\n📊 Migration Status\n');

  const status = await migrationService.getStatus();

  console.log(`Applied: ${status.applied}`);
  console.log(`Pending: ${status.pending}`);
  console.log('');

  if (status.files.length === 0) {
    console.log('No migration files found.\n');
    return;
  }

  console.log('┌─────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Status   │ Migration                              │ Applied At          │');
  console.log('├─────────────────────────────────────────────────────────────────────────┤');

  for (const file of status.files) {
    const statusIcon = file.status === 'applied' ? '✅' : '⏳';
    const statusText = file.status === 'applied' ? 'applied' : 'pending';
    const appliedAt = file.appliedAt ? formatDate(file.appliedAt) : '-';
    const name = file.name.length > 40 ? file.name.slice(0, 37) + '...' : file.name.padEnd(40);

    console.log(`│ ${statusIcon} ${statusText.padEnd(6)} │ ${name} │ ${appliedAt.padEnd(19)} │`);
  }

  console.log('└─────────────────────────────────────────────────────────────────────────┘\n');

  if (status.pending > 0) {
    console.log(`💡 Run 'npm run db:migrate' to apply ${status.pending} pending migration(s)\n`);
  }
}

async function runMigrations(): Promise<void> {
  console.log('\n🚀 Running Migrations\n');

  const result = await migrationService.runPending();

  if (result.applied.length === 0 && result.success) {
    console.log('✅ No pending migrations to apply.\n');
    return;
  }

  if (result.applied.length > 0) {
    console.log('Applied migrations:');
    for (const name of result.applied) {
      console.log(`  ✅ ${name}`);
    }
    console.log('');
  }

  if (!result.success) {
    console.log(`\n❌ Migration failed: ${result.failed}`);
    console.log(`   Error: ${result.error}\n`);
    process.exit(1);
  }

  console.log(`\n✅ Successfully applied ${result.applied.length} migration(s)\n`);
}

async function createMigration(name: string): Promise<void> {
  if (!name) {
    console.error('\n❌ Error: Migration name is required');
    console.log('Usage: npx tsx scripts/migrate.ts create <migration-name>');
    console.log('Example: npx tsx scripts/migrate.ts create add-user-avatar\n');
    process.exit(1);
  }

  // Sanitize name (allow only alphanumeric and dashes)
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  console.log('\n📝 Creating Migration\n');

  const fileName = migrationService.createMigration(sanitized);

  console.log(`\n✅ Created: server/migrations/${fileName}`);
  console.log('\nNext steps:');
  console.log(`  1. Edit server/migrations/${fileName}`);
  console.log('  2. Write your SQL migration');
  console.log('  3. Run: npm run db:migrate\n');
}

async function validateChecksums(): Promise<void> {
  console.log('\n🔍 Validating Migration Checksums\n');

  const mismatches = await migrationService.validateChecksums();

  if (mismatches.length === 0) {
    console.log('✅ All migration checksums match.\n');
    return;
  }

  console.log(`⚠️  Found ${mismatches.length} migration(s) with modified content:\n`);

  for (const m of mismatches) {
    console.log(`  ❌ ${m.name}`);
    console.log(`     Expected checksum: ${m.expected}`);
    console.log(`     Actual checksum:   ${m.actual}`);
    console.log('');
  }

  console.log('⚠️  Warning: Modifying applied migrations is dangerous!');
  console.log('   Consider creating a new migration instead.\n');
  process.exit(1);
}

// ========================================
// MAIN
// ========================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ Error: DATABASE_URL environment variable is required\n');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'status':
        await showStatus();
        break;

      case 'run':
        await runMigrations();
        break;

      case 'create':
        await createMigration(args[1]);
        break;

      case 'validate':
        await validateChecksums();
        break;

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        if (command) {
          console.error(`\n❌ Unknown command: ${command}`);
        }
        printHelp();
        process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error('\n❌ Migration error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  process.exit(0);
}

main();
