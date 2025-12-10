-- Add battery pricing columns
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS battery_manual_pricing BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS battery_fixed_markup DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS battery_percent_markup DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS battery_include_vat BOOLEAN NOT NULL DEFAULT false;

-- Add brake pricing columns
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS brake_manual_pricing BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS brake_fixed_markup DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS brake_percent_markup DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS brake_include_vat BOOLEAN NOT NULL DEFAULT false;
