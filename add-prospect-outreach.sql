-- ===============================================================
-- Sales Outreach Pipeline
-- 1) Erweiterungen an prospect_workshops
-- 2) Tabelle prospect_outreach_emails
-- 3) Application "sales-outreach" registrieren
-- ===============================================================

-- 1) prospect_workshops Erweiterungen
ALTER TABLE prospect_workshops
  ADD COLUMN IF NOT EXISTS contact_person       TEXT,
  ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_analyzed_at  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS ai_insights          JSONB,
  ADD COLUMN IF NOT EXISTS website_raw_text     TEXT;

-- 2) prospect_outreach_emails
CREATE TABLE IF NOT EXISTS prospect_outreach_emails (
  id                    TEXT PRIMARY KEY,
  prospect_id           TEXT NOT NULL,
  direction             TEXT NOT NULL DEFAULT 'OUTBOUND',
  template_type         TEXT NOT NULL DEFAULT 'CUSTOM',
  sent_by_id            TEXT,
  from_email            TEXT NOT NULL,
  to_email              TEXT NOT NULL,
  subject               TEXT NOT NULL,
  body                  TEXT NOT NULL,
  body_html             TEXT,
  message_id            TEXT NOT NULL UNIQUE,
  in_reply_to           TEXT,
  thread_id             TEXT,
  status                TEXT NOT NULL DEFAULT 'DRAFT',
  scheduled_for         TIMESTAMP(3),
  sent_at               TIMESTAMP(3),
  error_message         TEXT,
  "openedAt"            TIMESTAMP(3),
  open_count            INTEGER NOT NULL DEFAULT 0,
  "clickedAt"           TIMESTAMP(3),
  click_count           INTEGER NOT NULL DEFAULT 0,
  replied_at            TIMESTAMP(3),
  ai_generated          BOOLEAN NOT NULL DEFAULT false,
  ai_prompt_used        TEXT,
  ai_insights_snapshot  JSONB,
  created_at            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT prospect_outreach_emails_prospect_fk
    FOREIGN KEY (prospect_id) REFERENCES prospect_workshops(id) ON DELETE CASCADE,
  CONSTRAINT prospect_outreach_emails_sender_fk
    FOREIGN KEY (sent_by_id) REFERENCES b24_employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS pro_outreach_prospect_idx  ON prospect_outreach_emails(prospect_id);
CREATE INDEX IF NOT EXISTS pro_outreach_sender_idx    ON prospect_outreach_emails(sent_by_id);
CREATE INDEX IF NOT EXISTS pro_outreach_status_idx    ON prospect_outreach_emails(status);
CREATE INDEX IF NOT EXISTS pro_outreach_direction_idx ON prospect_outreach_emails(direction);
CREATE INDEX IF NOT EXISTS pro_outreach_thread_idx    ON prospect_outreach_emails(thread_id);
CREATE INDEX IF NOT EXISTS pro_outreach_sent_at_idx   ON prospect_outreach_emails(sent_at);

-- 3) Application "sales-outreach" registrieren
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applications WHERE key = 'sales-outreach') THEN
    INSERT INTO applications (
      id, key, name, description, icon, "adminRoute",
      color, category, "sortOrder", "isActive", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'sales-outreach',
      'Sales Outreach',
      'Cold-Outreach an Prospects: KI-Analyse, Email-Sequenzen, Reply-Tracking',
      'Send',
      '/admin/sales',
      'orange',
      'SALES',
      35,
      true,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Sales-Outreach Application created';
  ELSE
    RAISE NOTICE 'Sales-Outreach Application already exists';
  END IF;
END $$;

-- 4) Application allen ADMINs (und bestehenden Sales-Mitarbeitern) zuweisen
INSERT INTO b24_employee_applications (id, "employeeId", "applicationKey", "assignedAt", "assignedBy")
SELECT
  gen_random_uuid()::text,
  emp.id,
  'sales-outreach',
  NOW(),
  'system'
FROM b24_employees emp
WHERE emp.id IN (
  SELECT DISTINCT "employeeId" FROM b24_employee_applications WHERE "applicationKey" = 'sales'
)
AND NOT EXISTS (
  SELECT 1 FROM b24_employee_applications
  WHERE "employeeId" = emp.id AND "applicationKey" = 'sales-outreach'
);

SELECT 'Sales Outreach Setup completed' AS result,
       (SELECT COUNT(*) FROM prospect_outreach_emails) AS existing_emails,
       (SELECT COUNT(*) FROM b24_employee_applications WHERE "applicationKey" = 'sales-outreach') AS employees_with_access;
