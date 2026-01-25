-- Add invoice email credentials to invoice_settings table
-- These are used for sending invoices (separate from employee email accounts)

ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS "invoiceEmail" TEXT;
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS "invoicePassword" TEXT;

-- Set default values (user will update via UI)
UPDATE invoice_settings 
SET "invoiceEmail" = 'info@bereifung24.de',
    "invoicePassword" = ''
WHERE "invoiceEmail" IS NULL;

-- Verify
SELECT 
  id,
  "companyName",
  "invoiceEmail",
  CASE 
    WHEN "invoicePassword" IS NULL OR "invoicePassword" = '' THEN '⚠️ Passwort nicht gesetzt'
    ELSE '✅ Passwort konfiguriert (' || length("invoicePassword") || ' Zeichen)'
  END as password_status
FROM invoice_settings;
