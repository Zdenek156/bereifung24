-- AlterTable DirectBooking add missing fields for booking flow
ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "date" DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "time" VARCHAR(5) NOT NULL DEFAULT '09:00';
ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'RESERVED';
ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "reserved_until" TIMESTAMP;
ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "payment_id" VARCHAR(255);

-- Create index for slot availability checks
CREATE INDEX IF NOT EXISTS "direct_bookings_workshop_date_time_idx" ON "direct_bookings"("workshop_id", "date", "time");
CREATE INDEX IF NOT EXISTS "direct_bookings_status_idx" ON "direct_bookings"("status");
