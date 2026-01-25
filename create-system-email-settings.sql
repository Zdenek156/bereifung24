-- Create system email settings entry WITHOUT password
-- User will set the password via admin UI at /admin/email-settings

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
  '',  -- Empty - will be set via UI
  false,  -- false = TLS/STARTTLS (port 587)
  NULL,   -- IMPORTANT: NULL for system email (not employee-specific)
  NULL,   -- IMPORTANT: NULL for system email (not user-specific)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "smtpHost" = EXCLUDED."smtpHost",
  "smtpPort" = EXCLUDED."smtpPort",
  "smtpUser" = EXCLUDED."smtpUser",
  "smtpSecure" = EXCLUDED."smtpSecure",
  "b24EmployeeId" = NULL,
  "userId" = NULL,
  "updatedAt" = NOW();

-- Verify
SELECT 
  id,
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpSecure",
  "b24EmployeeId",
  "userId",
  CASE 
    WHEN "smtpPassword" = '' OR "smtpPassword" IS NULL THEN '⚠️ Passwort nicht gesetzt - bitte über /admin/email-settings setzen'
    ELSE '✅ Passwort konfiguriert'
  END as password_status
FROM email_settings
WHERE id = 'system-invoice-email';
