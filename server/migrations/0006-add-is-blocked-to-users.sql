-- Migration: Add is_blocked field to users table
-- Allows admins to block/unblock users

-- Add is_blocked column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_blocked" BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for efficient querying of blocked users
CREATE INDEX IF NOT EXISTS "IDX_users_is_blocked" ON "users" ("is_blocked");

-- Add comment for documentation
COMMENT ON COLUMN "users"."is_blocked" IS 'Indicates if user is blocked by admin';
