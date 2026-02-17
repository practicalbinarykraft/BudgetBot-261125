-- Migration: Create session table for PostgreSQL session store
-- This replaces the in-memory session store with persistent database storage

-- Create session table (compatible with connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);

-- Add primary key constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

-- Create index on expiration for efficient cleanup
CREATE INDEX IF NOT EXISTS "IDX_session_expire"
  ON "session" ("expire");

-- Add comment for documentation
COMMENT ON TABLE "session" IS 'User sessions managed by connect-pg-simple. Sessions persist across server restarts.';
COMMENT ON COLUMN "session"."sid" IS 'Session ID (primary key)';
COMMENT ON COLUMN "session"."sess" IS 'Session data stored as JSON';
COMMENT ON COLUMN "session"."expire" IS 'Session expiration timestamp (indexed for cleanup)';

-- Grant permissions (adjust if needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "session" TO your_app_user;
