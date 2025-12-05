/**
 * Backup Service
 *
 * Handles user data export and backup operations.
 * Junior-Friendly: ~120 lines, clear backup patterns
 *
 * Features:
 * - Export user data to JSON
 * - GDPR-compliant data export
 * - Selective table export
 */

import { db } from '../db';
import {
  users, wallets, transactions, categories,
  budgets, recurring, wishlist
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logInfo, logError } from '../lib/logger';

/**
 * User data export format (flexible types for DB compatibility)
 */
export interface UserDataExport {
  exportedAt: string;
  userId: number;
  user: {
    email: string;
    name: string;
    createdAt: Date;
  };
  wallets: unknown[];
  transactions: unknown[];
  categories: unknown[];
  budgets: unknown[];
  recurring: unknown[];
  wishlist: unknown[];
}

/**
 * Export all user data for backup or GDPR request
 */
export async function exportUserData(userId: number): Promise<UserDataExport> {
  logInfo('Starting user data export', { userId });

  try {
    // Fetch user
    const [user] = await db
      .select({
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    // Fetch all related data in parallel
    const [
      userWallets,
      userTransactions,
      userCategories,
      userBudgets,
      userRecurring,
      userWishlist,
    ] = await Promise.all([
      db.select().from(wallets).where(eq(wallets.userId, userId)),
      db.select().from(transactions).where(eq(transactions.userId, userId)),
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(budgets).where(eq(budgets.userId, userId)),
      db.select().from(recurring).where(eq(recurring.userId, userId)),
      db.select().from(wishlist).where(eq(wishlist.userId, userId)),
    ]);

    const exportData: UserDataExport = {
      exportedAt: new Date().toISOString(),
      userId,
      user,
      wallets: userWallets,
      transactions: userTransactions,
      categories: userCategories,
      budgets: userBudgets,
      recurring: userRecurring,
      wishlist: userWishlist,
    };

    logInfo('User data export completed', {
      userId,
      wallets: userWallets.length,
      transactions: userTransactions.length,
      categories: userCategories.length,
    });

    return exportData;
  } catch (error) {
    logError('User data export failed', error, { userId });
    throw error;
  }
}

/**
 * Get export statistics (for UI preview)
 */
export async function getExportStats(userId: number): Promise<{
  wallets: number;
  transactions: number;
  categories: number;
  budgets: number;
  recurring: number;
  wishlist: number;
}> {
  const [
    walletsCount,
    transactionsCount,
    categoriesCount,
    budgetsCount,
    recurringCount,
    wishlistCount,
  ] = await Promise.all([
    db.select().from(wallets).where(eq(wallets.userId, userId)),
    db.select().from(transactions).where(eq(transactions.userId, userId)),
    db.select().from(categories).where(eq(categories.userId, userId)),
    db.select().from(budgets).where(eq(budgets.userId, userId)),
    db.select().from(recurring).where(eq(recurring.userId, userId)),
    db.select().from(wishlist).where(eq(wishlist.userId, userId)),
  ]);

  return {
    wallets: walletsCount.length,
    transactions: transactionsCount.length,
    categories: categoriesCount.length,
    budgets: budgetsCount.length,
    recurring: recurringCount.length,
    wishlist: wishlistCount.length,
  };
}
