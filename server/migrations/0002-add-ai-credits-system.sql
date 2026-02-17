-- AI Credits System Migration
-- Author: AI Integration Team
-- Date: 2025-01-01
-- Description: System for tracking free AI message quota (50 messages per user)

-- 1. User Credits Table (message-based quota)
CREATE TABLE IF NOT EXISTS user_credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  messages_remaining INTEGER NOT NULL DEFAULT 50, -- Оставшиеся бесплатные сообщения
  total_granted INTEGER NOT NULL DEFAULT 50,      -- Всего было дано
  total_used INTEGER NOT NULL DEFAULT 0,          -- Всего использовано
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- 2. AI Usage Log (история каждого AI запроса)
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,                             -- deepseek/deepseek-chat:free
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 1,        -- Списано сообщений (обычно 1)
  was_free BOOLEAN NOT NULL DEFAULT TRUE,          -- Использован бесплатный лимит?
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at);

-- 3. Credit Transactions (история начислений/списаний)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                              -- 'welcome_bonus' | 'usage' | 'purchase' | 'admin_grant'
  messages_change INTEGER NOT NULL,                -- +50 или -1
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,                                  -- Дополнительные данные
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- Grant free credits to existing users
-- (Только тем, у кого еще нет записи)
INSERT INTO user_credits (user_id, messages_remaining, total_granted, total_used)
SELECT id, 50, 50, 0
FROM users
WHERE id NOT IN (SELECT user_id FROM user_credits);

-- Record welcome bonus for existing users
INSERT INTO credit_transactions (user_id, type, messages_change, balance_before, balance_after, description, metadata)
SELECT
  id,
  'welcome_bonus',
  50,
  0,
  50,
  'Welcome bonus - 50 free AI messages',
  '{"source": "migration", "auto_granted": true}'::jsonb
FROM users
WHERE id NOT IN (
  SELECT user_id FROM credit_transactions WHERE type = 'welcome_bonus'
);
