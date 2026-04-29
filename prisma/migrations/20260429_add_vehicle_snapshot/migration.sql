-- Add vehicleSnapshot column to DirectBooking for preserving vehicle data
-- even after the customer deletes the vehicle from their fleet.
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "vehicle_snapshot" JSONB;
