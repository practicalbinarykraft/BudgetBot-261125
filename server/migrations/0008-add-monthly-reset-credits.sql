-- Migration: Add monthly reset fields to user_credits
-- These fields support automatic monthly credit refresh for free-tier users.

ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS monthly_allowance INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP;

-- Fix any existing negative balances before adding constraint
UPDATE user_credits SET messages_remaining = 0 WHERE messages_remaining < 0;

-- Prevent negative balance at DB level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credits_non_negative'
  ) THEN
    ALTER TABLE user_credits
      ADD CONSTRAINT credits_non_negative CHECK (messages_remaining >= 0);
  END IF;
END $$;
