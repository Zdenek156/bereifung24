ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "selectedTireOptionId" TEXT;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_selectedTireOptionId_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_selectedTireOptionId_fkey FOREIGN KEY ("selectedTireOptionId") REFERENCES tire_options(id) ON DELETE SET NULL ON UPDATE CASCADE;
