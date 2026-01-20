-- Migration: Add currency field to planned_transactions table
-- Description: Adds multi-currency support for planned expenses
-- Created: 2026-01-20

-- Add currency column with default 'USD' (safe - uses IF NOT EXISTS)
ALTER TABLE planned_transactions 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Add comment for documentation
COMMENT ON COLUMN planned_transactions.currency IS 'Currency code for the planned expense (USD, RUB, EUR, etc.)';
