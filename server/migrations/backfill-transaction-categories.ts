/**
 * Backfill categoryId for existing transactions
 * 
 * This migration populates the new categoryId field by matching
 * the legacy text category field with the actual category names.
 * 
 * Run once after adding categoryId column to transactions table.
 * 
 * Usage: tsx server/migrations/backfill-transaction-categories.ts
 */

import { db } from "../db";
import { transactions, categories } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logInfo, logError } from '../lib/logger';

async function backfillTransactionCategories() {
  logInfo("🔄 Starting transaction categoryId backfill...");

  try {
    // Get all transactions without categoryId
    const transactionsToUpdate = await db
      .select()
      .from(transactions)
      .where(isNull(transactions.categoryId));

    logInfo(`Found ${transactionsToUpdate.length} transactions to backfill`);

    let updated = 0;
    let skipped = 0;

    for (const transaction of transactionsToUpdate) {
      if (!transaction.category) {
        // No category text - skip
        skipped++;
        continue;
      }

      // Find matching category by name and userId
      const matchingCategories = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.userId, transaction.userId),
            eq(categories.name, transaction.category)
          )
        );

      if (matchingCategories.length > 0) {
        // Update transaction with categoryId
        await db
          .update(transactions)
          .set({ categoryId: matchingCategories[0].id })
          .where(eq(transactions.id, transaction.id));

        updated++;
        
        if (updated % 10 === 0) {
          logInfo(`  ✅ Updated ${updated} transactions...`);
        }
      } else {
        logInfo(`  ⚠️  No category found for "${transaction.category}" (transaction #${transaction.id})`);
        skipped++;
      }
    }

    logInfo("\n✅ Backfill completed!");
    logInfo(`  - Updated: ${updated} transactions`);
    logInfo(`  - Skipped: ${skipped} transactions`);
    logInfo(`  - Total: ${transactionsToUpdate.length} transactions\n`);

  } catch (error) {
    logError("Backfill failed", error);
    throw error;
  }
}

// Run the migration
backfillTransactionCategories()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
