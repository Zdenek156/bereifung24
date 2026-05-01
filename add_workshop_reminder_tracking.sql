-- Add workshop appointment-reminder tracking to direct_bookings
-- Used by /api/cron/push-reminders to deduplicate workshop pushes

ALTER TABLE direct_bookings
  ADD COLUMN IF NOT EXISTS workshop_reminder_sent_at TIMESTAMP(3);
