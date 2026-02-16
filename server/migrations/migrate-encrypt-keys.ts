/**
 * Data migration: Encrypt existing API keys
 *
 * This script migrates unencrypted API keys to encrypted format
 * Run this AFTER running the SQL migration to add new columns
 *
 * Usage:
 *   ENCRYPTION_KEY=<your-key> DATABASE_URL=<url> tsx server/migrations/migrate-encrypt-keys.ts
 */

import { db } from '../db';
import { settings } from '@shared/schema';
import { eq, or, isNotNull } from 'drizzle-orm';
import { encrypt, isEncrypted } from '../lib/encryption';
import { logInfo, logError } from '../lib/logger';

async function migrateEncryptKeys() {
  logInfo('🔐 Starting API key encryption migration...\n');

  // Find all settings with unencrypted API keys
  const allSettings = await db
    .select()
    .from(settings)
    .where(
      or(
        isNotNull(settings.anthropicApiKey),
        isNotNull(settings.openaiApiKey)
      )
    );

  logInfo(`Found ${allSettings.length} users with API keys to migrate\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const setting of allSettings) {
    try {
      const updates: Record<string, string> = {};
      let needsUpdate = false;

      // Migrate Anthropic API key
      if (setting.anthropicApiKey && !setting.anthropicApiKeyEncrypted) {
        // Skip if already encrypted
        if (!isEncrypted(setting.anthropicApiKey)) {
          logInfo(`  [User ${setting.userId}] Encrypting Anthropic API key...`);
          updates.anthropicApiKeyEncrypted = encrypt(setting.anthropicApiKey);
          needsUpdate = true;
        } else {
          logInfo(`  [User ${setting.userId}] Anthropic key already encrypted, skipping`);
          skippedCount++;
        }
      }

      // Migrate OpenAI API key
      if (setting.openaiApiKey && !setting.openaiApiKeyEncrypted) {
        // Skip if already encrypted
        if (!isEncrypted(setting.openaiApiKey)) {
          logInfo(`  [User ${setting.userId}] Encrypting OpenAI API key...`);
          updates.openaiApiKeyEncrypted = encrypt(setting.openaiApiKey);
          needsUpdate = true;
        } else {
          logInfo(`  [User ${setting.userId}] OpenAI key already encrypted, skipping`);
          skippedCount++;
        }
      }

      // Update if needed
      if (needsUpdate) {
        await db
          .update(settings)
          .set(updates)
          .where(eq(settings.id, setting.id));

        migratedCount++;
        logInfo(`  ✅ [User ${setting.userId}] Migration successful\n`);
      }

    } catch (error: unknown) {
      errorCount++;
      logError(`  ❌ [User ${setting.userId}] Migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  logInfo('\n📊 Migration Summary:');
  logInfo(`  ✅ Migrated: ${migratedCount}`);
  logInfo(`  ⏭️  Skipped:  ${skippedCount}`);
  logInfo(`  ❌ Errors:   ${errorCount}`);
  logInfo(`  📦 Total:    ${allSettings.length}\n`);

  if (errorCount === 0) {
    logInfo('🎉 Migration completed successfully!\n');
    logInfo('Next steps:');
    logInfo('  1. Verify the migration in production');
    logInfo('  2. Monitor for any errors');
    logInfo('  3. After 1-2 weeks, remove legacy columns:');
    logInfo('     ALTER TABLE settings DROP COLUMN anthropic_api_key;');
    logInfo('     ALTER TABLE settings DROP COLUMN openai_api_key;');
  } else {
    logInfo('⚠️  Migration completed with errors. Please check the logs above.\n');
    process.exit(1);
  }
}

// Run migration
migrateEncryptKeys()
  .then(() => {
    logInfo('Done!');
    process.exit(0);
  })
  .catch((error) => {
    logError('Fatal error during migration:', error);
    process.exit(1);
  });
