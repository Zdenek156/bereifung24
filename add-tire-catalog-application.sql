-- Add Tire Catalog Application for Permission System
-- Run this after tire catalog tables are created

-- Check if application already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applications WHERE key = 'reifenkatalog') THEN
    INSERT INTO applications (
      id,
      key,
      name,
      description,
      icon,
      "adminRoute",
      color,
      category,
      "sortOrder",
      "isActive",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      'reifenkatalog',
      'Reifenkatalog',
      'Zentrale Reifenverwaltung mit Multi-Supplier Support',
      'Package',
      '/admin/tire-catalog',
      'orange',
      'OPERATIONS',
      43,
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Tire Catalog Application created successfully';
  ELSE
    RAISE NOTICE 'ℹ️  Tire Catalog Application already exists';
  END IF;
END $$;
