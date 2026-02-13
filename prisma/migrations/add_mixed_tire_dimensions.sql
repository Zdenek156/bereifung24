-- Add mixed tire dimensions support
ALTER TABLE "vehicles" ADD COLUMN "tire_dimensions_front" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "tire_dimensions_rear" TEXT;

-- Add comment for clarity
COMMENT ON COLUMN "vehicles"."tire_dimensions_front" IS 'Front axle tire dimensions (e.g., 245/35 R21)';
COMMENT ON COLUMN "vehicles"."tire_dimensions_rear" IS 'Rear axle tire dimensions (e.g., 275/30 R21)';
