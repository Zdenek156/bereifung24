-- CreateTable
CREATE TABLE "workshop_services" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "runFlatSurcharge" DOUBLE PRECISION,
    "disposalFee" DOUBLE PRECISION,
    "wheelSizeSurcharge" JSONB,
    "durationMinutes" INTEGER NOT NULL,
    "durationMinutes4" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_services_workshopId_serviceType_key" ON "workshop_services"("workshopId", "serviceType");

-- AddForeignKey
ALTER TABLE "workshop_services" ADD CONSTRAINT "workshop_services_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
