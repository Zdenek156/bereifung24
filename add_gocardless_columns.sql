-- Add GoCardless columns to workshops table
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS "gocardlessCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "gocardlessMandateId" TEXT,
ADD COLUMN IF NOT EXISTS "gocardlessMandateStatus" TEXT,
ADD COLUMN IF NOT EXISTS "gocardlessMandateRef" TEXT,
ADD COLUMN IF NOT EXISTS "gocardlessMandateCreatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gocardlessBankAccountId" TEXT;

-- Add GoCardless columns to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION DEFAULT 19.0,
ADD COLUMN IF NOT EXISTS "taxAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "billingPeriodStart" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "billingPeriodEnd" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "billingMonth" INTEGER,
ADD COLUMN IF NOT EXISTS "billingYear" INTEGER,
ADD COLUMN IF NOT EXISTS "gocardlessPaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "gocardlessPaymentStatus" TEXT,
ADD COLUMN IF NOT EXISTS "gocardlessChargeDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gocardlessPayoutId" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION DEFAULT 4.9;

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "workshops_gocardlessCustomerId_key" ON workshops("gocardlessCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "workshops_gocardlessMandateId_key" ON workshops("gocardlessMandateId");
CREATE UNIQUE INDEX IF NOT EXISTS "workshops_gocardlessMandateRef_key" ON workshops("gocardlessMandateRef");
CREATE UNIQUE INDEX IF NOT EXISTS "commissions_gocardlessPaymentId_key" ON commissions("gocardlessPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "commissions_invoiceNumber_key" ON commissions("invoiceNumber");
