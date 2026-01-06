-- Migration: Make email and password nullable for Telegram-only users
-- Created: 2026-01-03

-- Step 1: Remove NOT NULL constraint from email
ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

-- Step 2: Remove NOT NULL constraint from password
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;

-- Step 3: Add CHECK constraint: user must have EITHER email OR telegram_id
ALTER TABLE users
ADD CONSTRAINT users_auth_method_check
CHECK (
  (email IS NOT NULL AND password IS NOT NULL) OR
  (telegram_id IS NOT NULL)
);

-- Step 4: Create index for faster telegram_id lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id) WHERE telegram_id IS NOT NULL;

-- Step 5: Add telegram_first_name and telegram_photo_url for richer profiles
ALTER TABLE users
ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT;
