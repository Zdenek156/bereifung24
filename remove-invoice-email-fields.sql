-- Remove invoice email fields from invoice_settings table
-- These fields are being replaced with a dedicated EmailSettings entry

ALTER TABLE invoice_settings DROP COLUMN IF EXISTS "invoiceEmailFrom";
ALTER TABLE invoice_settings DROP COLUMN IF EXISTS "invoiceEmailFromName";

-- Verify removal
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoice_settings' 
  AND column_name IN ('invoiceEmailFrom', 'invoiceEmailFromName');

-- Should return 0 rows
