-- ============================================
-- SUPPLIER MANAGEMENT - Complete Schema Migration
-- Run: sudo -u postgres psql -d bereifung24 -f /tmp/add-supplier-management.sql
-- ============================================

-- 1. Main Supplier Management Table
CREATE TABLE IF NOT EXISTS supplier_management (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  legal_form TEXT,
  category TEXT NOT NULL DEFAULT 'SONSTIGES',
  website TEXT,
  street TEXT,
  zip_code TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'Deutschland',
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  customer_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Supplier Contacts Table
CREATE TABLE IF NOT EXISTS supplier_contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id TEXT NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  purposes TEXT[] DEFAULT '{}',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);

-- 3. Supplier API Configuration Table
CREATE TABLE IF NOT EXISTS supplier_api_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id TEXT NOT NULL UNIQUE REFERENCES supplier_management(id) ON DELETE CASCADE,
  api_mode TEXT NOT NULL DEFAULT 'NONE',
  api_endpoint TEXT,
  api_test_endpoint TEXT,
  auth_type TEXT,
  api_username TEXT,
  api_password TEXT,
  api_key TEXT,
  csv_download_url TEXT,
  csv_format TEXT,
  csv_auto_update BOOLEAN NOT NULL DEFAULT false,
  csv_update_schedule TEXT,
  last_api_check TIMESTAMP(3),
  last_api_error TEXT,
  last_csv_import TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Supplier Referral Program Table
CREATE TABLE IF NOT EXISTS supplier_referral_programs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id TEXT NOT NULL UNIQUE REFERENCES supplier_management(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  referral_code TEXT,
  registration_link TEXT,
  bonus_per_new_customer DOUBLE PRECISION,
  bonus_for_referred DOUBLE PRECISION,
  conditions TEXT,
  valid_from TIMESTAMP(3),
  valid_until TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Supplier Email Templates Table
CREATE TABLE IF NOT EXISTS supplier_email_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id TEXT NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_email_templates_supplier_id ON supplier_email_templates(supplier_id);

-- 6. Add connection_status to workshop_suppliers (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workshop_suppliers' AND column_name = 'connection_status'
  ) THEN
    ALTER TABLE workshop_suppliers ADD COLUMN connection_status TEXT DEFAULT 'LIVE';
  END IF;
END $$;

-- Done
DO $$ BEGIN RAISE NOTICE '✅ Supplier Management tables created successfully'; END $$;
