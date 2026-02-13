-- Add mixed tire dimension columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_dimensions_front TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_dimensions_rear TEXT;
