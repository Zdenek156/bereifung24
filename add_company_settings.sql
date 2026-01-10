-- CreateTable: CompanySettings
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL DEFAULT 'Bereifung24 GmbH',
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "taxNumber" TEXT,
    "vatNumber" TEXT,
    "accountantName" TEXT,
    "accountantEmail" TEXT,
    "accountantCompany" TEXT,
    "accountantAddress" TEXT,
    "accountantPhone" TEXT,
    "accountantTaxNumber" TEXT,
    "smtpHost" TEXT,
    "smtpPort" TEXT,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFrom" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
