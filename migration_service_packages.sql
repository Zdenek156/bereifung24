-- CreateTable
CREATE TABLE IF NOT EXISTS "service_packages" (
    "id" TEXT NOT NULL,
    "workshopServiceId" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "service_packages_workshopServiceId_packageType_key" 
ON "service_packages"("workshopServiceId", "packageType");

-- AddForeignKey
ALTER TABLE "service_packages" 
ADD CONSTRAINT "service_packages_workshopServiceId_fkey" 
FOREIGN KEY ("workshopServiceId") 
REFERENCES "workshop_services"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add packages column to workshop_services
ALTER TABLE "workshop_services" 
ADD COLUMN IF NOT EXISTS "packages" JSONB;
