-- Add refrigerantPricePer100ml field to workshop_services table
ALTER TABLE "workshop_services" ADD COLUMN IF NOT EXISTS "refrigerantPricePer100ml" DOUBLE PRECISION;
