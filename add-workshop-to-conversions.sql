-- Add workshopId column to affiliate_conversions table
ALTER TABLE "affiliate_conversions" 
ADD COLUMN "workshop_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "affiliate_conversions"
ADD CONSTRAINT "affiliate_conversions_workshop_id_fkey" 
FOREIGN KEY ("workshop_id") 
REFERENCES "workshops"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX "affiliate_conversions_workshop_id_idx" 
ON "affiliate_conversions"("workshop_id");
