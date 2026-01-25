-- Check email settings
SELECT 
  id,
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpSecure",
  CASE 
    WHEN "smtpPassword" IS NULL THEN 'NOT SET'
    WHEN "smtpPassword" = '' THEN 'EMPTY'
    ELSE 'SET (' || length("smtpPassword") || ' chars)'
  END as password_status,
  "b24EmployeeId",
  "userId"
FROM email_settings
ORDER BY "createdAt" DESC
LIMIT 5;
