-- Add Telegram-related fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
  ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT;

-- Make email and password nullable for Telegram-only users
ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password DROP NOT NULL;

-- Add constraint: user must have EITHER email OR telegram_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_method_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_auth_method_check
      CHECK (
        (email IS NOT NULL AND password IS NOT NULL) OR
        (telegram_id IS NOT NULL)
      );
  END IF;
END $$;

