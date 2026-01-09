-- Add missing columns to provisions table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'provisions' AND column_name = 'releasedamount') THEN
        ALTER TABLE "provisions" ADD COLUMN "releasedAmount" DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'provisions' AND column_name = 'releasedat') THEN
        ALTER TABLE "provisions" ADD COLUMN "releasedAt" TIMESTAMP(3);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'provisions' AND column_name = 'entryid') THEN
        ALTER TABLE "provisions" ADD COLUMN "entryId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'provisions' AND column_name = 'notes') THEN
        ALTER TABLE "provisions" ADD COLUMN "notes" TEXT;
    END IF;
END $$;
