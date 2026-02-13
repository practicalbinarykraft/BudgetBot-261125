import { Router } from "express";
import { db } from "../db";
import {
  transactions,
  wallets,
  calibrations,
  recurring,
  plannedTransactions,
  wishlist,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "../middleware/auth-utils";
import { logAuditEvent, AuditAction, AuditEntityType } from "../services/audit-log.service";
import { cache } from "../lib/redis";
import { getErrorMessage } from "../lib/errors";

const router = Router();

/**
 * POST /api/account/reset
 *
 * Atomic reset: deletes all financial data and recreates a default wallet.
 * Categories, settings, profile, and assets are preserved.
 *
 * Body (optional):
 *   includeRecurring: boolean (default true)
 *   includePlanned: boolean (default true)
 *   includeWishlist: boolean (default false)
 */
router.post("/reset", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const {
      includeRecurring = true,
      includePlanned = true,
      includeWishlist = false,
    } = req.body || {};

    const result = await db.transaction(async (tx) => {
      // 1. Delete calibrations (FK to wallets with cascade, but explicit for clarity)
      await tx.delete(calibrations).where(eq(calibrations.userId, userId));

      // 2. Delete all transactions
      await tx.delete(transactions).where(eq(transactions.userId, userId));

      // 3. Delete all wallets
      await tx.delete(wallets).where(eq(wallets.userId, userId));

      // 4. Optional: recurring payments
      if (includeRecurring) {
        await tx.delete(recurring).where(eq(recurring.userId, userId));
      }

      // 5. Optional: planned transactions
      if (includePlanned) {
        await tx.delete(plannedTransactions).where(eq(plannedTransactions.userId, userId));
      }

      // 6. Optional: wishlist
      if (includeWishlist) {
        await tx.delete(wishlist).where(eq(wishlist.userId, userId));
      }

      // 7. Recreate default wallet
      const today = new Date().toISOString().split('T')[0];
      const [newWallet] = await tx
        .insert(wallets)
        .values({
          userId,
          name: "My Wallet",
          type: "cash",
          balance: "0",
          currency: "USD",
          balanceUsd: "0",
          openingBalanceUsd: "0",
          openingBalanceDate: today,
        })
        .returning();

      return { walletId: newWallet.id };
    });

    // Audit log
    await logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: userId,
      metadata: {
        operation: "reset_account",
        includeRecurring,
        includePlanned,
        includeWishlist,
        newWalletId: result.walletId,
      },
      req,
    });

    // Invalidate caches (pattern: keys include :limit: and :offset: suffixes)
    await cache.delPattern(`wallets:user:${userId}:*`);

    res.json({
      success: true,
      walletId: result.walletId,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;
