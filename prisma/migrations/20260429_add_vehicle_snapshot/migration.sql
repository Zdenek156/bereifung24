-- Add vehicleSnapshot column to direct_bookings for preserving vehicle data
-- even after the customer deletes the vehicle from their fleet.
ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "vehicle_snapshot" JSONB;
