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

async function migrateEncryptKeys() {
  console.log('🔐 Starting API key encryption migration...\n');

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

  console.log(`Found ${allSettings.length} users with API keys to migrate\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const setting of allSettings) {
    try {
      const updates: any = {};
      let needsUpdate = false;

      // Migrate Anthropic API key
      if (setting.anthropicApiKey && !setting.anthropicApiKeyEncrypted) {
        // Skip if already encrypted
        if (!isEncrypted(setting.anthropicApiKey)) {
          console.log(`  [User ${setting.userId}] Encrypting Anthropic API key...`);
          updates.anthropicApiKeyEncrypted = encrypt(setting.anthropicApiKey);
          needsUpdate = true;
        } else {
          console.log(`  [User ${setting.userId}] Anthropic key already encrypted, skipping`);
          skippedCount++;
        }
      }

      // Migrate OpenAI API key
      if (setting.openaiApiKey && !setting.openaiApiKeyEncrypted) {
        // Skip if already encrypted
        if (!isEncrypted(setting.openaiApiKey)) {
          console.log(`  [User ${setting.userId}] Encrypting OpenAI API key...`);
          updates.openaiApiKeyEncrypted = encrypt(setting.openaiApiKey);
          needsUpdate = true;
        } else {
          console.log(`  [User ${setting.userId}] OpenAI key already encrypted, skipping`);
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
        console.log(`  ✅ [User ${setting.userId}] Migration successful\n`);
      }

    } catch (error: any) {
      errorCount++;
      console.error(`  ❌ [User ${setting.userId}] Migration failed: ${error.message}\n`);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${migratedCount}`);
  console.log(`  ⏭️  Skipped:  ${skippedCount}`);
  console.log(`  ❌ Errors:   ${errorCount}`);
  console.log(`  📦 Total:    ${allSettings.length}\n`);

  if (errorCount === 0) {
    console.log('🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Verify the migration in production');
    console.log('  2. Monitor for any errors');
    console.log('  3. After 1-2 weeks, remove legacy columns:');
    console.log('     ALTER TABLE settings DROP COLUMN anthropic_api_key;');
    console.log('     ALTER TABLE settings DROP COLUMN openai_api_key;');
  } else {
    console.log('⚠️  Migration completed with errors. Please check the logs above.\n');
    process.exit(1);
  }
}

// Run migration
migrateEncryptKeys()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  });
