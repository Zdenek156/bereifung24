-- Setup email settings for invoice sending (system email, no employee/user)
-- b24EmployeeId and userId must be NULL for invoice sending
-- The email service will find this by looking for EmailSettings WHERE b24EmployeeId IS NULL AND userId IS NULL

INSERT INTO email_settings (
  id,
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpPassword",
  "smtpSecure",
  "b24EmployeeId",
  "userId",
  "createdAt",
  "updatedAt"
) VALUES (
  'system-invoice-email',
  'mail.your-server.de',
  587,
  'info@bereifung24.de',
  'REPLACE_WITH_ACTUAL_PASSWORD',  -- ⚠️ Du musst das echte Passwort eintragen
  false,  -- false = TLS/STARTTLS (port 587), true = SSL (port 465)
  NULL,   -- WICHTIG: NULL für System-Email (nicht Mitarbeiter-spezifisch)
  NULL,   -- WICHTIG: NULL für System-Email (nicht User-spezifisch)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "smtpHost" = EXCLUDED."smtpHost",
  "smtpPort" = EXCLUDED."smtpPort",
  "smtpUser" = EXCLUDED."smtpUser",
  "smtpPassword" = EXCLUDED."smtpPassword",
  "smtpSecure" = EXCLUDED."smtpSecure",
  "b24EmployeeId" = NULL,
  "userId" = NULL,
  "updatedAt" = NOW();

-- Verify: Check if system email settings were created correctly
SELECT 
  id,
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpSecure",
  "b24EmployeeId",
  "userId",
  CASE 
    WHEN "smtpPassword" = 'REPLACE_WITH_ACTUAL_PASSWORD' THEN '⚠️ PASSWORT NICHT GESETZT - BITTE ERSETZEN!'
    WHEN length("smtpPassword") > 0 THEN '✅ Passwort konfiguriert (' || length("smtpPassword") || ' Zeichen)'
    ELSE '❌ Kein Passwort'
  END as password_status
FROM email_settings
WHERE id = 'system-invoice-email';
