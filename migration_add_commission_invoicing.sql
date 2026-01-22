-- CreateTable: Commission Invoicing System
-- Migration: add_commission_invoicing_system

-- Commission Invoices Table
CREATE TABLE "commission_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "workshopId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "lineItems" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "commissionIds" TEXT[],
    "sepaPaymentId" TEXT,
    "sepaStatus" TEXT,
    "accountingEntryId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    
    CONSTRAINT "fk_workshop" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_accounting_entry" FOREIGN KEY ("accountingEntryId") REFERENCES "accounting_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for commission_invoices
CREATE INDEX "commission_invoices_workshopId_idx" ON "commission_invoices"("workshopId");
CREATE INDEX "commission_invoices_status_idx" ON "commission_invoices"("status");
CREATE INDEX "commission_invoices_periodStart_periodEnd_idx" ON "commission_invoices"("periodStart", "periodEnd");
CREATE INDEX "commission_invoices_invoiceNumber_idx" ON "commission_invoices"("invoiceNumber");

-- Invoice Settings Table
CREATE TABLE "invoice_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentNumber" INTEGER NOT NULL DEFAULT 1,
    "prefix" TEXT NOT NULL DEFAULT 'B24-INV',
    "companyName" TEXT NOT NULL DEFAULT 'Bereifung24 GmbH',
    "companyStreet" TEXT,
    "companyZip" TEXT,
    "companyCity" TEXT,
    "companyCountry" TEXT NOT NULL DEFAULT 'Deutschland',
    "taxId" TEXT,
    "taxNumber" TEXT,
    "registerCourt" TEXT,
    "registerNumber" TEXT,
    "managingDirector" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT NOT NULL DEFAULT 'www.bereifung24.de',
    "bankName" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "gocardlessCreditorId" TEXT,
    "logoUrl" TEXT,
    "templateHtml" TEXT,
    "footerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Insert default invoice settings
INSERT INTO "invoice_settings" ("id", "currentNumber", "prefix", "companyName", "website", "companyCountry")
VALUES ('default-settings', 1, 'B24-INV', 'Bereifung24 GmbH', 'www.bereifung24.de', 'Deutschland');
