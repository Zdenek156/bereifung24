-- Tire Change Service Pricing by Rim Size
-- Montagepreis pro Reifen nach Zollgröße (13"-23")
CREATE TABLE IF NOT EXISTS tire_change_pricing_by_size (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    rim_size INTEGER NOT NULL,
    price_per_tire DOUBLE PRECISION NOT NULL,
    duration_per_tire INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workshop_id, rim_size)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tire_change_pricing_workshop ON tire_change_pricing_by_size(workshop_id);
CREATE INDEX IF NOT EXISTS idx_tire_change_pricing_workshop_rim ON tire_change_pricing_by_size(workshop_id, rim_size);
