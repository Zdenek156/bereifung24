-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY');

-- CreateEnum
CREATE TYPE "EntrySourceType" AS ENUM ('COMMISSION', 'EXPENSE', 'TRAVEL_EXPENSE', 'PAYROLL', 'PROCUREMENT', 'INFLUENCER', 'VEHICLE', 'MANUAL');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "VehicleCostType" AS ENUM ('FUEL', 'MAINTENANCE', 'INSURANCE', 'TAX', 'REPAIRS', 'PARKING', 'TOLLS', 'WASHING', 'TIRES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('DATEV', 'EXCEL', 'PDF');

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "skrType" TEXT NOT NULL DEFAULT 'SKR04',
    "parentAccount" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "debitAccount" TEXT NOT NULL,
    "creditAccount" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "vatRate" INTEGER DEFAULT 0,
    "vatAmount" DECIMAL(10,2),
    "netAmount" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "documentNumber" TEXT,
    "sourceType" "EntrySourceType" NOT NULL,
    "sourceId" TEXT,
    "attachmentUrls" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedById" TEXT,
    "isStorno" BOOLEAN NOT NULL DEFAULT false,
    "originalEntryId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_audit_logs" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossSalary" DECIMAL(10,2) NOT NULL,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "socialSecurity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxBreakdown" TEXT,
    "svBreakdown" TEXT,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_costs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "costType" "VehicleCostType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mileage" INTEGER,
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_settings" (
    "id" TEXT NOT NULL,
    "taxAdvisorName" TEXT,
    "taxAdvisorCompany" TEXT,
    "taxAdvisorEmail" TEXT,
    "taxAdvisorPhone" TEXT,
    "taxAdvisorAddress" TEXT,
    "companyTaxNumber" TEXT,
    "companyVatId" TEXT,
    "preferredExportFormat" "ExportFormat" NOT NULL DEFAULT 'EXCEL',
    "accountingSystem" TEXT NOT NULL DEFAULT 'SKR04',
    "entryNumberPrefix" TEXT NOT NULL DEFAULT 'BEL',
    "entryNumberCounter" INTEGER NOT NULL DEFAULT 0,
    "defaultVatRate" INTEGER NOT NULL DEFAULT 19,
    "reducedVatRate" INTEGER NOT NULL DEFAULT 7,
    "autoLockAfterExport" BOOLEAN NOT NULL DEFAULT false,
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_accountNumber_key" ON "chart_of_accounts"("accountNumber");

-- CreateIndex
CREATE INDEX "chart_of_accounts_accountNumber_idx" ON "chart_of_accounts"("accountNumber");

-- CreateIndex
CREATE INDEX "chart_of_accounts_accountType_idx" ON "chart_of_accounts"("accountType");

-- CreateIndex
CREATE INDEX "chart_of_accounts_skrType_idx" ON "chart_of_accounts"("skrType");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entries_entryNumber_key" ON "accounting_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "accounting_entries_bookingDate_idx" ON "accounting_entries"("bookingDate");

-- CreateIndex
CREATE INDEX "accounting_entries_entryNumber_idx" ON "accounting_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "accounting_entries_sourceType_sourceId_idx" ON "accounting_entries"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "accounting_entries_debitAccount_idx" ON "accounting_entries"("debitAccount");

-- CreateIndex
CREATE INDEX "accounting_entries_creditAccount_idx" ON "accounting_entries"("creditAccount");

-- CreateIndex
CREATE INDEX "accounting_entries_locked_idx" ON "accounting_entries"("locked");

-- CreateIndex
CREATE INDEX "accounting_audit_logs_entryId_idx" ON "accounting_audit_logs"("entryId");

-- CreateIndex
CREATE INDEX "accounting_audit_logs_timestamp_idx" ON "accounting_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "payroll_status_idx" ON "payroll"("status");

-- CreateIndex
CREATE INDEX "payroll_month_year_idx" ON "payroll"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_employeeId_month_year_key" ON "payroll"("employeeId", "month", "year");

-- CreateIndex
CREATE INDEX "vehicle_costs_assetId_date_idx" ON "vehicle_costs"("assetId", "date");

-- CreateIndex
CREATE INDEX "vehicle_costs_costType_idx" ON "vehicle_costs"("costType");

-- CreateIndex
CREATE INDEX "vehicle_costs_date_idx" ON "vehicle_costs"("date");

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_originalEntryId_fkey" FOREIGN KEY ("originalEntryId") REFERENCES "accounting_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_audit_logs" ADD CONSTRAINT "accounting_audit_logs_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "accounting_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_audit_logs" ADD CONSTRAINT "accounting_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "b24_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_costs" ADD CONSTRAINT "vehicle_costs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
