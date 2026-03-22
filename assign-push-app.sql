DO $$
DECLARE
  emp_record RECORD;
  app_key TEXT := 'push-benachrichtigungen';
BEGIN
  FOR emp_record IN 
    SELECT DISTINCT ea."employeeId" AS id 
    FROM b24_employee_applications ea 
    WHERE ea."applicationKey" IN ('buchhaltung', 'customers', 'support')
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
  RAISE NOTICE '✅ Push-Benachrichtigungen assigned to employees';
END $$;
