-- CreateTable
CREATE TABLE "BalanceSheet" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "assets" JSONB NOT NULL,
    "liabilities" JSONB NOT NULL,
    "totalAssets" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalLiabilities" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "BalanceSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeStatement" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "revenue" JSONB NOT NULL,
    "expenses" JSONB NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,

    CONSTRAINT "IncomeStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depreciation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "depreciationRate" DECIMAL(5,2) NOT NULL,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'LINEAR',
    "amount" DECIMAL(10,2) NOT NULL,
    "accumulatedDepreciation" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bookValue" DECIMAL(10,2) NOT NULL,
    "entryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provision" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "description" TEXT NOT NULL,
    "reason" TEXT,
    "entryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Provision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalAccount" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "capitalIncrease" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "capitalDecrease" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "privateWithdrawals" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "privateDeposits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearEndClosing" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "balanceSheetId" TEXT,
    "incomeStatementId" TEXT,
    "capitalAccountId" TEXT,
    "closingDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearEndClosing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceSheet_year_idx" ON "BalanceSheet"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceSheet_year_fiscalYear_key" ON "BalanceSheet"("year", "fiscalYear");

-- CreateIndex
CREATE INDEX "IncomeStatement_year_idx" ON "IncomeStatement"("year");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeStatement_year_fiscalYear_key" ON "IncomeStatement"("year", "fiscalYear");

-- CreateIndex
CREATE INDEX "Depreciation_assetId_idx" ON "Depreciation"("assetId");

-- CreateIndex
CREATE INDEX "Depreciation_year_month_idx" ON "Depreciation"("year", "month");

-- CreateIndex
CREATE INDEX "Provision_type_idx" ON "Provision"("type");

-- CreateIndex
CREATE INDEX "Provision_year_month_idx" ON "Provision"("year", "month");

-- CreateIndex
CREATE INDEX "CapitalAccount_year_idx" ON "CapitalAccount"("year");

-- CreateIndex
CREATE UNIQUE INDEX "CapitalAccount_year_key" ON "CapitalAccount"("year");

-- CreateIndex
CREATE INDEX "YearEndClosing_year_idx" ON "YearEndClosing"("year");

-- CreateIndex
CREATE UNIQUE INDEX "YearEndClosing_year_fiscalYear_key" ON "YearEndClosing"("year", "fiscalYear");

-- AddForeignKey
ALTER TABLE "BalanceSheet" ADD CONSTRAINT "BalanceSheet_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceSheet" ADD CONSTRAINT "BalanceSheet_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeStatement" ADD CONSTRAINT "IncomeStatement_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depreciation" ADD CONSTRAINT "Depreciation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depreciation" ADD CONSTRAINT "Depreciation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "accounting_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provision" ADD CONSTRAINT "Provision_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "accounting_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosing" ADD CONSTRAINT "YearEndClosing_balanceSheetId_fkey" FOREIGN KEY ("balanceSheetId") REFERENCES "BalanceSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosing" ADD CONSTRAINT "YearEndClosing_incomeStatementId_fkey" FOREIGN KEY ("incomeStatementId") REFERENCES "IncomeStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosing" ADD CONSTRAINT "YearEndClosing_capitalAccountId_fkey" FOREIGN KEY ("capitalAccountId") REFERENCES "CapitalAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosing" ADD CONSTRAINT "YearEndClosing_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
