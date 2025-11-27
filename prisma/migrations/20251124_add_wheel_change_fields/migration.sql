-- AlterTable
ALTER TABLE "workshop_services" 
ADD COLUMN "balancingPrice" DOUBLE PRECISION,
ADD COLUMN "storagePrice" DOUBLE PRECISION,
ADD COLUMN "balancingMinutes" INTEGER,
ADD COLUMN "storageAvailable" BOOLEAN DEFAULT false;
