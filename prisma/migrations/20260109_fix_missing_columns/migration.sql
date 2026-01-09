-- Add missing columns to income_statements table
ALTER TABLE "income_statements" ADD COLUMN IF NOT EXISTS "financialResult" JSONB;
ALTER TABLE "income_statements" ADD COLUMN IF NOT EXISTS "earningsBeforeTax" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "income_statements" ADD COLUMN IF NOT EXISTS "taxes" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "income_statements" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "income_statements" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "income_statements" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Remove old columns that don't exist in schema
ALTER TABLE "income_statements" DROP COLUMN IF EXISTS "totalRevenue";
ALTER TABLE "income_statements" DROP COLUMN IF EXISTS "totalExpenses";
ALTER TABLE "income_statements" DROP COLUMN IF EXISTS "lockedBy";

-- Add missing columns to balance_sheets table
ALTER TABLE "balance_sheets" ADD COLUMN IF NOT EXISTS "totalAssets" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "balance_sheets" ADD COLUMN IF NOT EXISTS "totalLiabilities" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "balance_sheets" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "balance_sheets" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "balance_sheets" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Remove old column from balance_sheets
ALTER TABLE "balance_sheets" DROP COLUMN IF EXISTS "lockedBy";
