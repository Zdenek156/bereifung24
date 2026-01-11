-- CreateTable
CREATE TABLE "booking_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debitAccount" TEXT NOT NULL,
    "creditAccount" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_templates_description_idx" ON "booking_templates"("description");

-- CreateIndex
CREATE INDEX "booking_templates_useCount_idx" ON "booking_templates"("useCount");

-- AddForeignKey
ALTER TABLE "booking_templates" ADD CONSTRAINT "booking_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
