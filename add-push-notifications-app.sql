-- ============================================
-- Push-Benachrichtigungen Application
-- ============================================

-- 1. Create the push_notification_logs table
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  fcm_token TEXT,
  status TEXT NOT NULL DEFAULT 'SENT',
  error TEXT,
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  sent_by TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_type ON push_notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_created_at ON push_notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_status ON push_notification_logs(status);

-- 2. Register the application
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applications WHERE key = 'push-benachrichtigungen') THEN
    INSERT INTO applications (
      id, key, name, description, icon, "adminRoute", color, category, "sortOrder", "isActive", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'push-benachrichtigungen',
      'Push-Benachrichtigungen',
      'Push-Notifications an App-Nutzer senden (Termine, Saison-Tipps, Buchungsbestätigungen)',
      'Bell',
      '/admin/push-notifications',
      'violet',
      'OPERATIONS',
      46,
      true,
      NOW(),
      NOW()
    );
    RAISE NOTICE '✅ Push-Benachrichtigungen Application created';
  ELSE
    RAISE NOTICE 'ℹ️  Push-Benachrichtigungen Application already exists';
  END IF;
END $$;

-- 3. Assign to admin employees
DO $$
DECLARE
  emp_record RECORD;
  app_key TEXT := 'push-benachrichtigungen';
BEGIN
  FOR emp_record IN 
    SELECT id FROM b24_employees WHERE role = 'ADMIN'
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
