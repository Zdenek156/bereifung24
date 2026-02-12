-- AlterTable WorkshopSupplier - Add CSV Import Mode
-- Migration: 20260211_add_csv_supplier_mode

-- Add connection type (default API for existing suppliers)
ALTER TABLE "workshop_suppliers" ADD COLUMN "connection_type" TEXT NOT NULL DEFAULT 'API';

-- Add CSV import fields
ALTER TABLE "workshop_suppliers" ADD COLUMN "csv_import_url" TEXT;
ALTER TABLE "workshop_suppliers" ADD COLUMN "last_csv_sync" TIMESTAMP(3);
ALTER TABLE "workshop_suppliers" ADD COLUMN "csv_sync_status" TEXT;
ALTER TABLE "workshop_suppliers" ADD COLUMN "csv_sync_error" TEXT;
ALTER TABLE "workshop_suppliers" ADD COLUMN "requires_manual_order" BOOLEAN NOT NULL DEFAULT false;

-- Make API credentials optional (nullable)
ALTER TABLE "workshop_suppliers" ALTER COLUMN "username_encrypted" DROP NOT NULL;
ALTER TABLE "workshop_suppliers" ALTER COLUMN "password_encrypted" DROP NOT NULL;
ALTER TABLE "workshop_suppliers" ALTER COLUMN "encryption_iv" DROP NOT NULL;

-- Add check constraint for connection type
ALTER TABLE "workshop_suppliers" ADD CONSTRAINT "workshop_suppliers_connection_type_check" 
  CHECK ("connection_type" IN ('API', 'CSV'));

-- Comment for documentation
COMMENT ON COLUMN "workshop_suppliers"."connection_type" IS 'Connection type: API (with credentials) or CSV (with import URL)';
COMMENT ON COLUMN "workshop_suppliers"."csv_import_url" IS 'URL to download CSV file (for CSV connection type)';
COMMENT ON COLUMN "workshop_suppliers"."last_csv_sync" IS 'Last successful CSV synchronization timestamp';
COMMENT ON COLUMN "workshop_suppliers"."csv_sync_status" IS 'Current sync status: pending, syncing, success, error';
COMMENT ON COLUMN "workshop_suppliers"."csv_sync_error" IS 'Last sync error message (if any)';
COMMENT ON COLUMN "workshop_suppliers"."requires_manual_order" IS 'If true, orders must be placed manually (set automatically for CSV mode)';

-- Create WorkshopInventory table
CREATE TABLE "workshop_inventory" (
  "id" TEXT PRIMARY KEY,
  "workshop_id" TEXT NOT NULL,
  "supplier" TEXT NOT NULL,
  "article_number" TEXT NOT NULL,
  "brand" TEXT,
  "model" TEXT,
  "width" TEXT,
  "height" TEXT,
  "diameter" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "stock" INTEGER NOT NULL,
  "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "workshop_inventory_workshop_id_fkey" 
    FOREIGN KEY ("workshop_id") 
    REFERENCES "workshops"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
  CONSTRAINT "workshop_inventory_workshop_id_article_number_supplier_key" 
    UNIQUE ("workshop_id", "article_number", "supplier")
);

-- Create indexes
CREATE INDEX "workshop_inventory_workshop_id_supplier_idx" ON "workshop_inventory"("workshop_id", "supplier");
CREATE INDEX "workshop_inventory_supplier_article_number_idx" ON "workshop_inventory"("supplier", "article_number");

-- Comment for documentation
COMMENT ON TABLE "workshop_inventory" IS 'Tire inventory from CSV suppliers (synced hourly)';
COMMENT ON COLUMN "workshop_inventory"."supplier" IS 'Supplier code (TYRESYSTEM, SUPPLIER_B, etc.)';
COMMENT ON COLUMN "workshop_inventory"."article_number" IS 'Supplier article number';
COMMENT ON COLUMN "workshop_inventory"."last_updated" IS 'Last CSV sync timestamp';
