-- Migration: Add opening_balance_usd and opening_balance_date to wallets
-- These fields store the wallet's initial balance at creation time.
-- The trend calculator uses sum(opening_balance_usd) as the anchor
-- instead of current wallet balances, so editing/deleting transactions
-- no longer "rewrites history".

ALTER TABLE "wallets"
  ADD COLUMN IF NOT EXISTS "opening_balance_usd" DECIMAL(12, 2) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS "opening_balance_date" DATE;

-- Backfill: opening = current balance minus net effect of all transactions for this wallet
-- Formula: opening = balanceUsd - sum(income txs) + sum(expense txs)
-- This ensures: opening + net(transactions) = current balance (no data change)
UPDATE wallets w
SET
  opening_balance_usd = COALESCE(w.balance_usd, '0')::numeric - COALESCE(
    (SELECT SUM(
      CASE WHEN t.type = 'income' THEN t.amount_usd::numeric
           WHEN t.type = 'expense' THEN -t.amount_usd::numeric
           ELSE 0
      END
    )
    FROM transactions t
    WHERE t.wallet_id = w.id),
    0
  ),
  opening_balance_date = w.created_at::date;
