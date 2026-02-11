-- TyreSystem Integration Migration
-- Creates WorkshopSupplier and TirePricingBySize tables

-- Create tire_pricing_by_size table
CREATE TABLE IF NOT EXISTS "tire_pricing_by_size" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "rim_size" INTEGER NOT NULL,
    "vehicle_type" TEXT NOT NULL DEFAULT 'AUTO',
    "fixed_markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percent_markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "include_vat" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "tire_pricing_by_size_pkey" PRIMARY KEY ("id")
);

-- Create workshop_suppliers table
CREATE TABLE IF NOT EXISTS "workshop_suppliers" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username_encrypted" TEXT NOT NULL,
    "password_encrypted" TEXT NOT NULL,
    "encryption_iv" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_order" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "last_api_check" TIMESTAMP(3),
    "last_api_error" TEXT,
    "api_calls_today" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "workshop_suppliers_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "tire_pricing_by_size_workshop_id_rim_size_vehicle_type_key" 
    ON "tire_pricing_by_size"("workshop_id", "rim_size", "vehicle_type");

CREATE UNIQUE INDEX IF NOT EXISTS "workshop_suppliers_workshop_id_supplier_key" 
    ON "workshop_suppliers"("workshop_id", "supplier");

-- Add foreign key constraints
ALTER TABLE "tire_pricing_by_size" 
    ADD CONSTRAINT "tire_pricing_by_size_workshop_id_fkey" 
    FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workshop_suppliers" 
    ADD CONSTRAINT "workshop_suppliers_workshop_id_fkey" 
    FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
