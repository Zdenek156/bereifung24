-- Add missing columns to workshop_inventory
-- Migration: 20260213_add_inventory_ean_season_vehicle

ALTER TABLE "workshop_inventory" ADD COLUMN IF NOT EXISTS "ean" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN IF NOT EXISTS "season" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN IF NOT EXISTS "vehicle_type" TEXT;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS "workshop_inventory_ean_idx" ON "workshop_inventory"("ean");
CREATE INDEX IF NOT EXISTS "workshop_inventory_season_idx" ON "workshop_inventory"("season");
CREATE INDEX IF NOT EXISTS "workshop_inventory_vehicle_type_idx" ON "workshop_inventory"("vehicle_type");

-- Comments
COMMENT ON COLUMN "workshop_inventory"."ean" IS 'European Article Number (EAN barcode)';
COMMENT ON COLUMN "workshop_inventory"."season" IS 'Tire season: s (summer), w (winter), g (all-season)';
COMMENT ON COLUMN "workshop_inventory"."vehicle_type" IS 'Vehicle type: PKW or Motorrad';
