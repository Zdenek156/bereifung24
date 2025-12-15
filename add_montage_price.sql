-- Add montage_price column to tire_options table
ALTER TABLE tire_options ADD COLUMN IF NOT EXISTS montage_price DOUBLE PRECISION;
