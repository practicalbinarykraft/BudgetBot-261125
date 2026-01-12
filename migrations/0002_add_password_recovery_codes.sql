-- Migration: Add password_recovery_codes table
-- Created: 2026-01-06
-- Purpose: Store recovery codes for password reset via Telegram or Email

-- STEP 1: Create password_recovery_codes table
CREATE TABLE IF NOT EXISTS password_recovery_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- STEP 2: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON password_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON password_recovery_codes(code) WHERE used = FALSE;
CREATE INDEX IF NOT EXISTS idx_recovery_codes_expires_at ON password_recovery_codes(expires_at) WHERE used = FALSE;

-- STEP 3: Add comment for documentation
COMMENT ON TABLE password_recovery_codes IS 'Stores temporary recovery codes for password reset. Codes expire after 15 minutes.';
COMMENT ON COLUMN password_recovery_codes.code IS '6-digit recovery code';
COMMENT ON COLUMN password_recovery_codes.expires_at IS 'Timestamp when code expires (15 minutes from creation)';
COMMENT ON COLUMN password_recovery_codes.used IS 'Whether code has been used (prevents reuse)';

