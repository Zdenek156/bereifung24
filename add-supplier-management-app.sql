-- Add Supplier Management Application + Seed TyreSystem
-- Run: sudo -u postgres psql -d bereifung24 -f /tmp/add-supplier-management-app.sql

-- 1. Register the application
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applications WHERE key = 'lieferanten') THEN
    INSERT INTO applications (
      id, key, name, description, icon, "adminRoute", color, category, "sortOrder", "isActive", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'lieferanten',
      'Lieferantenverwaltung',
      'Zentrale Verwaltung aller Lieferanten mit Kontakten, API-Konfiguration und E-Mail-Templates',
      'Truck',
      '/admin/supplier-management',
      'cyan',
      'OPERATIONS',
      44,
      true,
      NOW(),
      NOW()
    );
    RAISE NOTICE '✅ Lieferanten Application created';
  ELSE
    RAISE NOTICE 'ℹ️  Lieferanten Application already exists';
  END IF;
END $$;

-- 2. Assign to admin user (assign to all existing admin employees)
DO $$
DECLARE
  emp_record RECORD;
  app_key TEXT := 'lieferanten';
BEGIN
  FOR emp_record IN 
    SELECT id FROM b24_employees WHERE role = 'ADMIN' OR id IN (
      SELECT "employeeId" FROM b24_employee_applications WHERE "applicationKey" = 'reifenkatalog'
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM b24_employee_applications 
      WHERE "employeeId" = emp_record.id AND "applicationKey" = app_key
    ) THEN
      INSERT INTO b24_employee_applications (
        id, "employeeId", "applicationKey", "assignedAt", "assignedBy"
      ) VALUES (
        gen_random_uuid()::text,
        emp_record.id,
        app_key,
        NOW(),
        'SYSTEM'
      );
    END IF;
  END LOOP;
  RAISE NOTICE '✅ Application assigned to admin employees';
END $$;

-- 3. Seed TyreSystem as first supplier
DO $$
DECLARE
  supplier_id TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supplier_management WHERE code = 'TYRESYSTEM') THEN
    supplier_id := gen_random_uuid()::text;
    
    -- Main supplier record
    INSERT INTO supplier_management (
      id, code, company_name, legal_form, category,
      website, street, zip_code, city, country,
      phone, email, is_active, notes,
      created_at, updated_at
    ) VALUES (
      supplier_id,
      'TYRESYSTEM',
      'TyreSystem GmbH',
      'GmbH',
      'REIFENGROSSHANDEL',
      'https://www.tyresystem.de',
      NULL, NULL, NULL, 'Deutschland',
      NULL, NULL, true,
      'Erster integrierter Reifengroßhändler. API-Anbindung für automatische Bestellungen aktiv.',
      NOW(), NOW()
    );
    
    -- API Config
    INSERT INTO supplier_api_configs (
      id, supplier_id, api_mode, api_endpoint, auth_type,
      csv_download_url, csv_format, csv_auto_update, csv_update_schedule,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text,
      supplier_id,
      'LIVE',
      'https://api.tyresystem.de/Rest',
      'BASIC',
      NULL, 'TYRESYSTEM', false, 'WEEKLY',
      NOW(), NOW()
    );
    
    -- Referral Program (inactive placeholder)
    INSERT INTO supplier_referral_programs (
      id, supplier_id, is_active,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text,
      supplier_id,
      false,
      NOW(), NOW()
    );
    
    RAISE NOTICE '✅ TyreSystem supplier created with ID: %', supplier_id;
  ELSE
    RAISE NOTICE 'ℹ️  TyreSystem supplier already exists';
  END IF;
END $$;
