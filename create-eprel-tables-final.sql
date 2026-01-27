CREATE TABLE IF NOT EXISTS eprel_tires (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    eprel_id TEXT UNIQUE,
    supplier_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    tyre_dimension TEXT NOT NULL,
    width INTEGER NOT NULL,
    aspect_ratio INTEGER NOT NULL,
    diameter INTEGER NOT NULL,
    load_index TEXT,
    speed_rating TEXT,
    tyre_class TEXT,
    has_3pmsf BOOLEAN DEFAULT false,
    has_ice_grip BOOLEAN DEFAULT false,
    fuel_efficiency_class TEXT,
    wet_grip_class TEXT,
    external_rolling_noise_level INTEGER,
    external_rolling_noise_class TEXT,
    additional_data JSONB,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_version TEXT
);

CREATE INDEX IF NOT EXISTS eprel_tires_dimensions_idx ON eprel_tires(width, aspect_ratio, diameter);
CREATE INDEX IF NOT EXISTS eprel_tires_dimension_idx ON eprel_tires(tyre_dimension);
CREATE INDEX IF NOT EXISTS eprel_tires_supplier_idx ON eprel_tires(supplier_name);
CREATE INDEX IF NOT EXISTS eprel_tires_class_idx ON eprel_tires(tyre_class);

CREATE TABLE IF NOT EXISTS eprel_imports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    status TEXT NOT NULL,
    tires_imported INTEGER DEFAULT 0,
    tires_updated INTEGER DEFAULT 0,
    tires_deleted INTEGER DEFAULT 0,
    error_message TEXT,
    data_version TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS eprel_imports_started_idx ON eprel_imports(started_at);
