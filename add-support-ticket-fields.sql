-- Migration: Add support ticket fields to chat_messages
-- Run on server: mysql -u root -p bereifung24 < add-support-ticket-fields.sql

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NULL AFTER message,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' AFTER subject,
  ADD COLUMN IF NOT EXISTS assigned_to_id VARCHAR(191) NULL AFTER priority,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT NULL AFTER assigned_to_id;

-- Update existing statuses to include IN_PROGRESS
-- (No data change needed, IN_PROGRESS is just a new valid value)

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_priority ON chat_messages(priority);
CREATE INDEX IF NOT EXISTS idx_chat_messages_assigned_to ON chat_messages(assigned_to_id);

SELECT 'Migration completed successfully' AS result;
