-- Migration: Create audit_log table for tracking user actions
-- Tracks all important user actions for security, debugging, and compliance

-- Create audit_log table
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "action" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" INTEGER,
  "metadata" TEXT,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "IDX_audit_log_user_id"
  ON "audit_log" ("user_id");

CREATE INDEX IF NOT EXISTS "IDX_audit_log_action"
  ON "audit_log" ("action");

CREATE INDEX IF NOT EXISTS "IDX_audit_log_entity"
  ON "audit_log" ("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "IDX_audit_log_created_at"
  ON "audit_log" ("created_at" DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS "IDX_audit_log_user_created"
  ON "audit_log" ("user_id", "created_at" DESC);

-- Add comments for documentation
COMMENT ON TABLE "audit_log" IS 'Audit trail of all user actions for security and compliance';
COMMENT ON COLUMN "audit_log"."id" IS 'Primary key';
COMMENT ON COLUMN "audit_log"."user_id" IS 'User who performed the action (FK to users table)';
COMMENT ON COLUMN "audit_log"."action" IS 'Action performed (e.g., create, update, delete, login)';
COMMENT ON COLUMN "audit_log"."entity_type" IS 'Type of entity affected (e.g., transaction, wallet, budget)';
COMMENT ON COLUMN "audit_log"."entity_id" IS 'ID of the affected entity (optional)';
COMMENT ON COLUMN "audit_log"."metadata" IS 'Additional details stored as JSON string';
COMMENT ON COLUMN "audit_log"."ip_address" IS 'IP address of the user (IPv4 or IPv6)';
COMMENT ON COLUMN "audit_log"."user_agent" IS 'User agent string from the request';
COMMENT ON COLUMN "audit_log"."created_at" IS 'Timestamp when the action occurred';
