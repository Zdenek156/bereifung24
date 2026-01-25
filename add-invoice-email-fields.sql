-- Add invoice email fields to invoice_settings table
ALTER TABLE invoice_settings ADD COLUMN "invoiceEmailFrom" TEXT;
ALTER TABLE invoice_settings ADD COLUMN "invoiceEmailFromName" TEXT;

-- Set default values for existing records
UPDATE invoice_settings 
SET "invoiceEmailFrom" = 'info@bereifung24.de',
    "invoiceEmailFromName" = 'Bereifung24 Buchhaltung'
WHERE "invoiceEmailFrom" IS NULL;
