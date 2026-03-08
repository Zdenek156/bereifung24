ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS storage_location VARCHAR(100);
ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS from_storage_booking_id TEXT;
