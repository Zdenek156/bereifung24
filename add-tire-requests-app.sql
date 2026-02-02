-- Add Tire Requests Admin Application
-- Run this after deploying the new code

-- Check if application already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applications WHERE key = 'TIRE_REQUESTS_MANAGEMENT') THEN
    INSERT INTO applications (
      id,
      key,
      name,
      description,
      icon,
      "adminRoute",
      color,
      "sortOrder",
      "isActive",
      category,
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'TIRE_REQUESTS_MANAGEMENT',
      'Anfragen-Übersicht',
      'Zentrale Verwaltung aller Kundenanfragen mit KPIs, Filtern und Notizen',
      'ClipboardList',
      '/admin/tire-requests',
      'orange',
      150,
      true,
      'VERWALTUNG',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Application Anfragen-Übersicht created successfully';
  ELSE
    RAISE NOTICE 'Application Anfragen-Übersicht already exists';
  END IF;
END $$;

-- Check for assignment table and assign to employees
DO $$
BEGIN
  -- Check if employee_application_assignments table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_application_assignments') THEN
    INSERT INTO employee_application_assignments (employee_id, application_id, created_at, updated_at)
    SELECT 
      e.id,
      a.id,
      NOW(),
      NOW()
    FROM employees e
    CROSS JOIN applications a
    WHERE a.key = 'TIRE_REQUESTS_MANAGEMENT'
      AND NOT EXISTS (
        SELECT 1 
        FROM employee_application_assignments eaa
        WHERE eaa.employee_id = e.id AND eaa.application_id = a.id
      );

    RAISE NOTICE 'Application assigned to all employees';
  ELSE
    RAISE NOTICE 'employee_application_assignments table does not exist - skipping assignment';
  END IF;
END $$;


