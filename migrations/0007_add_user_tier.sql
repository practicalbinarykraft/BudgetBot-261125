-- Migration: Add tier field to users table
-- Adds billing tier support: 'free', 'basic', 'pro', 'mega', 'myself'

-- Step 1: Add tier column with default 'free' (safe - uses IF NOT EXISTS)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';

-- Step 2: Add constraint to ensure valid tier values (safe - checks if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_tier_check' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_tier_check 
        CHECK (tier IN ('free', 'basic', 'pro', 'mega', 'myself'));
    END IF;
END $$;

-- Step 3: Assign 'myself' tier to specific user (safe - only updates if exists)
UPDATE users 
SET tier = 'myself' 
WHERE email = 'practicalbinarykraft@gmail.com' 
  AND (tier IS NULL OR tier != 'myself');

-- Step 4: Create index for faster tier lookups (safe - uses IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
