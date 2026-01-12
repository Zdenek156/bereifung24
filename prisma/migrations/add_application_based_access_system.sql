-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Layout',
    "adminRoute" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b24_employee_applications" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "applicationKey" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "b24_employee_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_key_key" ON "applications"("key");

-- CreateIndex
CREATE UNIQUE INDEX "b24_employee_applications_employeeId_applicationKey_key" ON "b24_employee_applications"("employeeId", "applicationKey");

-- AddForeignKey
ALTER TABLE "b24_employee_applications" ADD CONSTRAINT "b24_employee_applications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "b24_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b24_employee_applications" ADD CONSTRAINT "b24_employee_applications_applicationKey_fkey" FOREIGN KEY ("applicationKey") REFERENCES "applications"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable (will be done in separate migration after testing)
-- DROP TABLE "b24_employee_permissions";
