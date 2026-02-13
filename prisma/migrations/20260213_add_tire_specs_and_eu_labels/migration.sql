-- Add tire specifications and EU label fields to workshop_inventory

-- Add tire specifications
ALTER TABLE "workshop_inventory" ADD COLUMN "load_index" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN "speed_index" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN "run_flat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workshop_inventory" ADD COLUMN "three_pmsf" BOOLEAN NOT NULL DEFAULT false;

-- Add EU Tire Label fields (2020/740 Regulation)
ALTER TABLE "workshop_inventory" ADD COLUMN "label_fuel_efficiency" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN "label_wet_grip" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN "label_noise" INTEGER;
ALTER TABLE "workshop_inventory" ADD COLUMN "label_noise_class" TEXT;
ALTER TABLE "workshop_inventory" ADD COLUMN "eprel_url" TEXT;

-- Add indexes for tire search optimization
CREATE INDEX "workshop_inventory_workshopId_width_height_diameter_season_idx" ON "workshop_inventory"("workshop_id", "width", "height", "diameter", "season");
CREATE INDEX "workshop_inventory_workshopId_vehicleType_season_idx" ON "workshop_inventory"("workshop_id", "vehicle_type", "season");
