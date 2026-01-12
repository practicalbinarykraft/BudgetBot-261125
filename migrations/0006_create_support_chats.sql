-- Migration: Create support chats and messages tables for admin panel
-- Description: Stores support chats between admins and users
-- Created: 2026-01-07

CREATE TABLE IF NOT EXISTS support_chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'pending', 'resolved'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  subject TEXT, -- Subject/topic of the chat
  assigned_to INTEGER REFERENCES admin_users(id) ON DELETE SET NULL, -- Admin assigned to handle this chat
  last_message_at TIMESTAMP, -- When last message was sent
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_support_chats_user_id ON support_chats(user_id);
CREATE INDEX idx_support_chats_status ON support_chats(status);
CREATE INDEX idx_support_chats_assigned_to ON support_chats(assigned_to);
CREATE INDEX idx_support_chats_last_message_at ON support_chats(last_message_at DESC);
CREATE INDEX idx_support_chats_created_at ON support_chats(created_at DESC);

-- Table for support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user' or 'admin'
  sender_id INTEGER, -- user_id if sender_type='user', admin_id if sender_type='admin'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_support_messages_chat_id ON support_messages(chat_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at DESC);
CREATE INDEX idx_support_messages_is_read ON support_messages(is_read);
CREATE INDEX idx_support_messages_sender ON support_messages(sender_type, sender_id);

-- Add comments for documentation
COMMENT ON TABLE support_chats IS 'Support chats between users and admins';
COMMENT ON TABLE support_messages IS 'Messages in support chats';
COMMENT ON COLUMN support_chats.status IS 'Chat status: open, closed, pending, resolved';
COMMENT ON COLUMN support_chats.priority IS 'Chat priority: low, normal, high, urgent';
COMMENT ON COLUMN support_messages.sender_type IS 'Who sent the message: user or admin';

