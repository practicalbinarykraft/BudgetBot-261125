-- Migration: Create broadcasts table for admin panel
-- Description: Stores broadcast messages that can be sent to users
-- Created: 2026-01-07

CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  template_id TEXT, -- Reference to template (optional)
  target_segment TEXT, -- 'all', 'active', 'new_users', 'at_risk', etc.
  target_user_ids INTEGER[], -- Specific user IDs (optional)
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'cancelled'
  scheduled_at TIMESTAMP, -- When to send (if scheduled)
  sent_at TIMESTAMP, -- When actually sent
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcasts_created_at ON broadcasts(created_at DESC);
CREATE INDEX idx_broadcasts_scheduled_at ON broadcasts(scheduled_at);

-- Table for tracking broadcast recipients
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id SERIAL PRIMARY KEY,
  broadcast_id INTEGER REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user_id ON broadcast_recipients(user_id);
CREATE INDEX idx_broadcast_recipients_status ON broadcast_recipients(status);

-- Table for broadcast templates
CREATE TABLE IF NOT EXISTS broadcast_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  description TEXT,
  variables TEXT[], -- Available variables like {name}, {email}, etc.
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_broadcast_templates_name ON broadcast_templates(name);

