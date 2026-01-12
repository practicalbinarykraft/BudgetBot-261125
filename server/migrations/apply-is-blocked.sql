-- Quick migration to add is_blocked column if it doesn't exist
-- This is a safe migration that won't fail if column already exists

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_blocked'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "is_blocked" BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS "IDX_users_is_blocked" ON "users" ("is_blocked");
        COMMENT ON COLUMN "users"."is_blocked" IS 'Indicates if user is blocked by admin';
        RAISE NOTICE 'Column is_blocked added successfully';
    ELSE
        RAISE NOTICE 'Column is_blocked already exists';
    END IF;
END $$;
