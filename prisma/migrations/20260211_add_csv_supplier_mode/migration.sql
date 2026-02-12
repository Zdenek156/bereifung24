-- AlterTable WorkshopSupplier - Add CSV Import Mode
-- Migration: 20260211_add_csv_supplier_mode

-- Add connection type (default API for existing suppliers)
ALTER TABLE "WorkshopSupplier" ADD COLUMN "connectionType" TEXT NOT NULL DEFAULT 'API';

-- Add CSV import fields
ALTER TABLE "WorkshopSupplier" ADD COLUMN "csvImportUrl" TEXT;
ALTER TABLE "WorkshopSupplier" ADD COLUMN "lastCsvSync" TIMESTAMP(3);
ALTER TABLE "WorkshopSupplier" ADD COLUMN "csvSyncStatus" TEXT;
ALTER TABLE "WorkshopSupplier" ADD COLUMN "csvSyncError" TEXT;
ALTER TABLE "WorkshopSupplier" ADD COLUMN "requiresManualOrder" BOOLEAN NOT NULL DEFAULT false;

-- Make API credentials optional (nullable)
ALTER TABLE "WorkshopSupplier" ALTER COLUMN "usernameEncrypted" DROP NOT NULL;
ALTER TABLE "WorkshopSupplier" ALTER COLUMN "passwordEncrypted" DROP NOT NULL;
ALTER TABLE "WorkshopSupplier" ALTER COLUMN "encryptionIv" DROP NOT NULL;

-- Add check constraint for connection type
ALTER TABLE "WorkshopSupplier" ADD CONSTRAINT "WorkshopSupplier_connectionType_check" 
  CHECK ("connectionType" IN ('API', 'CSV'));

-- Comment for documentation
COMMENT ON COLUMN "WorkshopSupplier"."connectionType" IS 'Connection type: API (with credentials) or CSV (with import URL)';
COMMENT ON COLUMN "WorkshopSupplier"."csvImportUrl" IS 'URL to download CSV file (for CSV connection type)';
COMMENT ON COLUMN "WorkshopSupplier"."lastCsvSync" IS 'Last successful CSV synchronization timestamp';
COMMENT ON COLUMN "WorkshopSupplier"."csvSyncStatus" IS 'Current sync status: pending, syncing, success, error';
COMMENT ON COLUMN "WorkshopSupplier"."csvSyncError" IS 'Last sync error message (if any)';
COMMENT ON COLUMN "WorkshopSupplier"."requiresManualOrder" IS 'If true, orders must be placed manually (set automatically for CSV mode)';

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
