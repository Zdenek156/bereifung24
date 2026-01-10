-- Remove deprecated category column from provisions table
ALTER TABLE "provisions" DROP COLUMN IF EXISTS "category";

-- Also clean up deprecated month column and old index
ALTER TABLE "provisions" DROP COLUMN IF EXISTS "month";
DROP INDEX IF EXISTS "Provision_year_month_idx";
