-- Check invoice email credentials in database
SELECT 
  id,
  "companyName",
  "invoiceEmail",
  CASE 
    WHEN "invoicePassword" IS NULL OR "invoicePassword" = '' THEN '❌ Nicht gesetzt'
    ELSE '✅ Gesetzt (' || length("invoicePassword") || ' Zeichen)'
  END as password_status
FROM invoice_settings;
