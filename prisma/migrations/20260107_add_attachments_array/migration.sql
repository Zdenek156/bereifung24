-- AlterTable
ALTER TABLE "accounting_entries" 
  DROP COLUMN "attachmentUrls",
  ADD COLUMN "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
