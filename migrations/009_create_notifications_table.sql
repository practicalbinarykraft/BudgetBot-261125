-- Migration: Create notifications table for planned transactions reminders
-- Created: 2025-01-26

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification type and data
  type TEXT NOT NULL CHECK (type IN ('planned_expense', 'planned_income')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Reference to planned transaction
  planned_transaction_id INTEGER REFERENCES planned_transactions(id) ON DELETE CASCADE,
  planned_income_id INTEGER REFERENCES planned_income(id) ON DELETE CASCADE,
  
  -- Transaction data for pre-filling form (JSONB for flexibility)
  transaction_data JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'completed')),
  
  -- Dates
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Ensure at least one reference is set
  CONSTRAINT notifications_reference_check CHECK (
    (planned_transaction_id IS NOT NULL) OR (planned_income_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_planned_transaction_id ON notifications(planned_transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_planned_income_id ON notifications(planned_income_id);

-- Comments
COMMENT ON TABLE notifications IS 'Notifications for planned transactions that have reached their target date';
COMMENT ON COLUMN notifications.type IS 'Type of notification: planned_expense or planned_income';
COMMENT ON COLUMN notifications.transaction_data IS 'JSON data for pre-filling transaction form: {amount, currency, description, category, type, date, categoryId}';
COMMENT ON COLUMN notifications.status IS 'Notification status: unread, read, dismissed, or completed';
