-- Mobile App Schema Migration
-- Add fields for: Apple ID, Refresh Token, FCM Push, Notification Settings, App Login tracking

-- OAuth: Apple ID
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleId" TEXT UNIQUE;

-- Refresh Token
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenExpiry" TIMESTAMP(3);

-- FCM Push Notifications
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcmToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcmTokenUpdatedAt" TIMESTAMP(3);

-- App Login Tracking
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastAppLogin" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastAppVersion" TEXT;

-- Push Notification Settings (defaults: all enabled)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifyBookingConfirmation" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifyReminder" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifySeason" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifyBookingUpdate" BOOLEAN NOT NULL DEFAULT true;

-- App Version Table (Force Update mechanism)
CREATE TABLE IF NOT EXISTS "app_versions" (
  "id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "minVersion" TEXT NOT NULL,
  "latestVersion" TEXT NOT NULL,
  "updateUrl" TEXT NOT NULL,
  "forceUpdate" BOOLEAN NOT NULL DEFAULT false,
  "releaseNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_platform_key" ON "app_versions"("platform");

-- Seed initial app version records
INSERT INTO "app_versions" ("id", "platform", "minVersion", "latestVersion", "updateUrl", "forceUpdate", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'ios', '1.0.0', '1.0.0', 'https://apps.apple.com/app/bereifung24', false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'android', '1.0.0', '1.0.0', 'https://play.google.com/store/apps/details?id=de.bereifung24.app', false, CURRENT_TIMESTAMP)
ON CONFLICT ("platform") DO NOTHING;
