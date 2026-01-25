-- Add emailSent field to commission_invoices table
ALTER TABLE commission_invoices ADD COLUMN "emailSent" BOOLEAN NOT NULL DEFAULT false;
