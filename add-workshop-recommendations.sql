-- ===============================================================
-- Workshop Recommendation Mailer
-- Erstellt Tabelle für KI-generierte Empfehlungs-Emails an Werkstätten
-- und registriert die zugehörige Application für Permission-System
-- ===============================================================

-- 1) Tabelle workshop_recommendations
CREATE TABLE IF NOT EXISTS workshop_recommendations (
  id                TEXT PRIMARY KEY,
  "workshopId"      TEXT NOT NULL,
  "sentById"        TEXT,
  "sentByName"      TEXT,
  "adminNotes"      TEXT NOT NULL,
  topics            TEXT,
  tone              TEXT NOT NULL DEFAULT 'FRIENDLY',
  language          TEXT NOT NULL DEFAULT 'de',
  "generatedSubject" TEXT NOT NULL,
  "generatedBody"   TEXT NOT NULL,
  "finalSubject"    TEXT NOT NULL,
  "finalBody"       TEXT NOT NULL,
  "finalHtml"       TEXT NOT NULL,
  "recipientEmail"  TEXT NOT NULL,
  "recipientName"   TEXT,
  status            TEXT NOT NULL DEFAULT 'DRAFT',
  "sentAt"          TIMESTAMP(3),
  "errorMessage"    TEXT,
  "openedAt"        TIMESTAMP(3),
  "openCount"       INTEGER NOT NULL DEFAULT 0,
  "clickedCtaAt"    TIMESTAMP(3),
  "clickCount"      INTEGER NOT NULL DEFAULT 0,
  "ctaUrl"          TEXT,
  "followUpDate"    TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workshop_recommendations_workshop_fk
    FOREIGN KEY ("workshopId") REFERENCES workshops(id) ON DELETE CASCADE,
  CONSTRAINT workshop_recommendations_sender_fk
    FOREIGN KEY ("sentById") REFERENCES b24_employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS workshop_recommendations_workshop_idx ON workshop_recommendations("workshopId");
CREATE INDEX IF NOT EXISTS workshop_recommendations_sender_idx   ON workshop_recommendations("sentById");
CREATE INDEX IF NOT EXISTS workshop_recommendations_status_idx   ON workshop_recommendations(status);
CREATE INDEX IF NOT EXISTS workshop_recommendations_sentat_idx   ON workshop_recommendations("sentAt");

-- 2) Application für Permission-System registrieren
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM applications WHERE key = 'workshop-empfehlungen') THEN
    INSERT INTO applications (
      id, key, name, description, icon, "adminRoute",
      color, category, "sortOrder", "isActive", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'workshop-empfehlungen',
      'Werkstatt-Empfehlungen',
      'KI-generierte Optimierungs-Emails an Werkstätten senden (mit Open/Click-Tracking)',
      'Mail',
      '/admin/workshop-recommendations',
      'purple',
      'SALES',
      55,
      true,
      NOW(),
      NOW()
    );
    RAISE NOTICE '✅ Workshop-Empfehlungen Application created';
  ELSE
    RAISE NOTICE 'ℹ️  Workshop-Empfehlungen Application already exists';
  END IF;
END $$;

-- 3) Application allen ADMINs zuweisen
INSERT INTO b24_employee_applications (id, "employeeId", "applicationKey", "assignedAt", "assignedBy")
SELECT
  gen_random_uuid()::text,
  emp.id,
  'workshop-empfehlungen',
  NOW(),
  'system'
FROM b24_employees emp
WHERE NOT EXISTS (
  SELECT 1 FROM b24_employee_applications
  WHERE "employeeId" = emp.id AND "applicationKey" = 'workshop-empfehlungen'
);

SELECT 'Setup completed' AS result,
       (SELECT COUNT(*) FROM workshop_recommendations) AS existing_records,
       (SELECT COUNT(*) FROM b24_employee_applications WHERE "applicationKey" = 'workshop-empfehlungen') AS employees_with_access;
