/**
 * Initialize User Credits Migration
 *
 * Purpose: Create credit records for all existing users who don't have one
 * This gives all existing users 25 free credits to start using the billing system
 *
 * Run: npx tsx server/migrations/init-user-credits.ts
 */

import 'dotenv/config';
import { db } from '../db';
import { users, userCredits } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { logInfo, logError } from '../lib/logger';

const FREE_TIER_CREDITS = parseInt(process.env.FREE_TIER_CREDITS || '25', 10);

async function initializeUserCredits() {
  logInfo('🚀 Starting user credits initialization...');
  logInfo(`📊 Free tier credits: ${FREE_TIER_CREDITS}`);

  try {
    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users);
    logInfo(`👥 Found ${allUsers.length} total users`);

    // Get users who already have credits
    const usersWithCredits = await db
      .select({ userId: userCredits.userId })
      .from(userCredits);

    const userIdsWithCredits = new Set(usersWithCredits.map(u => u.userId));
    logInfo(`💳 ${usersWithCredits.length} users already have credits`);

    // Find users who need credits
    const usersNeedingCredits = allUsers.filter(u => !userIdsWithCredits.has(u.id));
    logInfo(`🆕 ${usersNeedingCredits.length} users need credits initialization`);

    if (usersNeedingCredits.length === 0) {
      logInfo('✅ All users already have credits. Nothing to do.');
      return;
    }

    // Initialize credits for users who don't have them
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersNeedingCredits) {
      try {
        await db.insert(userCredits).values({
          userId: user.id,
          messagesRemaining: FREE_TIER_CREDITS,
          totalGranted: FREE_TIER_CREDITS,
          totalUsed: 0,
        });
        successCount++;
        logInfo(`✅ User ${user.id}: Granted ${FREE_TIER_CREDITS} credits`);
      } catch (error) {
        errorCount++;
        logError(`User ${user.id}: Failed to grant credits`, error);
      }
    }

    logInfo('\n📊 Migration Summary:');
    logInfo(`   Total users: ${allUsers.length}`);
    logInfo(`   Already had credits: ${usersWithCredits.length}`);
    logInfo(`   Successfully initialized: ${successCount}`);
    logInfo(`   Errors: ${errorCount}`);
    logInfo('\n✅ Migration completed!');

  } catch (error) {
    logError('Migration failed', error);
    process.exit(1);
  }
}

// Run migration
initializeUserCredits()
  .then(() => process.exit(0))
  .catch((error) => {
    logError('Fatal error', error);
    process.exit(1);
  });
