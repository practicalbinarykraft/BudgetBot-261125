-- Add monthly reset fields to user_credits
ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS monthly_allowance INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP;

-- Prevent negative balance at DB level
ALTER TABLE user_credits
  ADD CONSTRAINT credits_non_negative CHECK (messages_remaining >= 0);
