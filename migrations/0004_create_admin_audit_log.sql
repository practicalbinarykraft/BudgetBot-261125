-- Migration: Create admin_audit_log table for tracking admin actions
-- Created: 2026-01-07
-- Phase 0: Admin Panel Backend - Audit Logging

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'user.ban', 'plan.change', 'broadcast.send', 'login', 'logout'
  entity_type TEXT, -- 'user', 'transaction', 'plan', 'broadcast'
  entity_id TEXT, -- ID of affected entity (can be string for flexibility)
  changes JSONB, -- before/after state or metadata
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Audit log for all admin panel actions. Tracks who did what, when, and from where.';
COMMENT ON COLUMN admin_audit_log.admin_id IS 'Admin user who performed the action (nullable for system actions)';
COMMENT ON COLUMN admin_audit_log.action IS 'Action type: user.ban, plan.change, broadcast.send, login, logout, etc.';
COMMENT ON COLUMN admin_audit_log.entity_type IS 'Type of entity affected: user, transaction, plan, etc.';
COMMENT ON COLUMN admin_audit_log.entity_id IS 'ID of affected entity (stored as TEXT for flexibility)';
COMMENT ON COLUMN admin_audit_log.changes IS 'JSONB with before/after state or additional metadata';

