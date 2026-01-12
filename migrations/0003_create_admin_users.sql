-- Migration: Create admin_users table for admin panel authentication
-- Created: 2026-01-07
-- Phase 0: Admin Panel Backend - Authentication

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support', -- 'super_admin', 'support', 'analyst', 'readonly'
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  ip_whitelist TEXT[],
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Add comments for documentation
COMMENT ON TABLE admin_users IS 'Admin users for admin panel access. Separate from regular users table.';
COMMENT ON COLUMN admin_users.email IS 'Admin email (unique, required)';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN admin_users.role IS 'Admin role: super_admin, support, analyst, readonly';
COMMENT ON COLUMN admin_users.permissions IS 'Array of specific permissions (e.g., ["users.read", "users.write"])';
COMMENT ON COLUMN admin_users.ip_whitelist IS 'Optional IP whitelist for additional security';

