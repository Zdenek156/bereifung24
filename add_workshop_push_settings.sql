-- Add workshop-specific push notification preferences to users
-- Run on Hetzner Postgres as bereifung24user (or as postgres then ALTER OWNER)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_ws_booking_received     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_ws_booking_cancelled    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_ws_review_received      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_ws_payout_received      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_ws_appointment_reminder BOOLEAN NOT NULL DEFAULT TRUE;
