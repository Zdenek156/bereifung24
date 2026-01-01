-- Add workshopId to affiliate_conversions table
ALTER TABLE "affiliate_conversions" 
ADD COLUMN "workshopId" TEXT;

-- Add foreign key constraint
ALTER TABLE "affiliate_conversions"
ADD CONSTRAINT "affiliate_conversions_workshopId_fkey" 
FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX "affiliate_conversions_workshopId_idx" ON "affiliate_conversions"("workshopId");
