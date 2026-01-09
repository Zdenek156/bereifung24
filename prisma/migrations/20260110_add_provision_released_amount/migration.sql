-- Add missing columns to provisions table if they don't exist
DO $$ 
BEGIN
    -- Check for releasedAmount (case-sensitive)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'provisions' 
                   AND column_name = 'releasedAmount') THEN
        ALTER TABLE "provisions" ADD COLUMN "releasedAmount" DECIMAL(10,2);
    END IF;
END $$;

