-- Create SupplierConfig table
CREATE TABLE IF NOT EXISTS "supplier_configs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "csv_download_url" TEXT,
  "csv_format" TEXT,
  "last_csv_import" TIMESTAMP(3),
  "csv_imported_by" TEXT,
  "api_endpoint" TEXT,
  "api_enabled" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TireCatalog table
CREATE TABLE IF NOT EXISTS "tire_catalog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "supplier" TEXT NOT NULL,
  "article_id" TEXT NOT NULL,
  "ean" TEXT,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "width" TEXT NOT NULL,
  "height" TEXT NOT NULL,
  "diameter" TEXT NOT NULL,
  "season" TEXT NOT NULL,
  "vehicle_type" TEXT NOT NULL DEFAULT 'PKW',
  "load_index" TEXT,
  "speed_index" TEXT,
  "run_flat" BOOLEAN NOT NULL DEFAULT false,
  "three_pmsf" BOOLEAN NOT NULL DEFAULT false,
  "label_fuel_efficiency" TEXT,
  "label_wet_grip" TEXT,
  "label_noise" INTEGER,
  "label_noise_class" TEXT,
  "eprel_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_sync" TIMESTAMP(3),
  "imported_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tire_catalog_supplier_article_id_key" UNIQUE ("supplier", "article_id")
);

-- Create indexes for TireCatalog
CREATE INDEX IF NOT EXISTS "tire_catalog_supplier_is_active_idx" ON "tire_catalog"("supplier", "is_active");
CREATE INDEX IF NOT EXISTS "tire_catalog_width_height_diameter_season_idx" ON "tire_catalog"("width", "height", "diameter", "season");
CREATE INDEX IF NOT EXISTS "tire_catalog_brand_idx" ON "tire_catalog"("brand");
CREATE INDEX IF NOT EXISTS "tire_catalog_season_idx" ON "tire_catalog"("season");
CREATE INDEX IF NOT EXISTS "tire_catalog_vehicle_type_idx" ON "tire_catalog"("vehicle_type");

-- Create TirePriceCache table
CREATE TABLE IF NOT EXISTS "tire_price_cache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workshop_id" TEXT NOT NULL,
  "tire_catalog_id" TEXT NOT NULL,
  "supplier" TEXT NOT NULL,
  "article_id" TEXT NOT NULL,
  "purchase_price" DECIMAL(10,2) NOT NULL,
  "selling_price" DECIMAL(10,2) NOT NULL,
  "stock" INTEGER NOT NULL,
  "markup_fixed" DECIMAL(10,2) NOT NULL,
  "markup_percent" DECIMAL(5,2) NOT NULL,
  "include_vat" BOOLEAN NOT NULL,
  "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "hit_count" INTEGER NOT NULL DEFAULT 0,
  "api_version" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tire_price_cache_workshop_id_tire_catalog_id_key" UNIQUE ("workshop_id", "tire_catalog_id"),
  CONSTRAINT "tire_price_cache_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tire_price_cache_tire_catalog_id_fkey" FOREIGN KEY ("tire_catalog_id") REFERENCES "tire_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for TirePriceCache
CREATE INDEX IF NOT EXISTS "tire_price_cache_workshop_id_expires_at_idx" ON "tire_price_cache"("workshop_id", "expires_at");
CREATE INDEX IF NOT EXISTS "tire_price_cache_supplier_article_id_idx" ON "tire_price_cache"("supplier", "article_id");
CREATE INDEX IF NOT EXISTS "tire_price_cache_expires_at_idx" ON "tire_price_cache"("expires_at");

-- Success message
SELECT 'Tire Catalog tables created successfully!' as message;
