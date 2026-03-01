-- TireCatalog: Zentraler Reifenkatalog (admin-managed)
-- Stammdaten für alle verfügbaren Reifen
CREATE TABLE "tire_catalog" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL DEFAULT 'TYRESYSTEM',
    
    -- TyreSystem IDs
    "article_id" TEXT NOT NULL,
    "ean" TEXT,
    
    -- Reifendaten
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "width" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "diameter" TEXT NOT NULL,
    "season" TEXT NOT NULL, -- 's' | 'w' | 'g'
    
    -- Spezifikationen
    "load_index" TEXT,
    "speed_index" TEXT,
    "run_flat" BOOLEAN NOT NULL DEFAULT false,
    "three_pmsf" BOOLEAN NOT NULL DEFAULT false,
    
    -- EU-Label
    "label_fuel_efficiency" TEXT,
    "label_wet_grip" TEXT,
    "label_noise" INTEGER,
    "eprel_url" TEXT,
    
    -- Verwaltung
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tire_catalog_pkey" PRIMARY KEY ("id")
);

-- TirePriceCache: Cache für Live-Preise (pro Werkstatt)
CREATE TABLE "tire_price_cache" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "tire_catalog_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    
    -- Pricing (vom TyreSystem API)
    "purchase_price" DOUBLE PRECISION NOT NULL, -- EK
    "selling_price" DOUBLE PRECISION NOT NULL,  -- VK (mit Markup)
    "stock" INTEGER NOT NULL,
    
    -- Cache Verwaltung
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL, -- cached_at + 60 minutes
    "api_calls_saved" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "tire_price_cache_pkey" PRIMARY KEY ("id")
);

-- Indexes für schnelle Suche
CREATE UNIQUE INDEX "tire_catalog_article_id_key" ON "tire_catalog"("article_id");
CREATE INDEX "tire_catalog_dimensions_idx" ON "tire_catalog"("width", "height", "diameter");
CREATE INDEX "tire_catalog_season_idx" ON "tire_catalog"("season");
CREATE INDEX "tire_catalog_brand_idx" ON "tire_catalog"("brand");

CREATE UNIQUE INDEX "tire_price_cache_workshop_tire_key" ON "tire_price_cache"("workshop_id", "tire_catalog_id");
CREATE INDEX "tire_price_cache_expires_idx" ON "tire_price_cache"("expires_at");

-- Foreign Keys
ALTER TABLE "tire_price_cache" ADD CONSTRAINT "tire_price_cache_workshop_id_fkey" 
    FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
ALTER TABLE "tire_price_cache" ADD CONSTRAINT "tire_price_cache_tire_catalog_id_fkey" 
    FOREIGN KEY ("tire_catalog_id") REFERENCES "tire_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Funktion zum Cleanup abgelaufener Cache-Einträge
CREATE OR REPLACE FUNCTION cleanup_expired_tire_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tire_price_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tire_catalog IS 'Zentraler Reifenkatalog - verwaltet im Admin-Bereich';
COMMENT ON TABLE tire_price_cache IS 'Cache für Live-Preise von TyreSystem API - TTL 60 Minuten';
COMMENT ON COLUMN tire_price_cache.api_calls_saved IS 'Anzahl der API-Calls die durch diesen Cache gespart wurden';
