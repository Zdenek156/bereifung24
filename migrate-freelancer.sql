-- Freelancer Dashboard - Manual Migration Script
-- Only creates new Freelancer tables and adds columns to workshops
-- Does NOT modify any existing tables

-- Step 1: Create Enums (if not exist)
DO $$ BEGIN
  CREATE TYPE "FreelancerTier" AS ENUM ('STARTER', 'BRONZE', 'SILVER', 'GOLD');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FreelancerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FreelancerLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'NEGOTIATION', 'ONBOARDED', 'LOST');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FreelancerLeadActivityType" AS ENUM ('CALL', 'EMAIL', 'VISIT', 'DEMO', 'NOTE', 'STATUS_CHANGE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FreelancerPayoutStatus" AS ENUM ('CALCULATED', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create Freelancer table
CREATE TABLE IF NOT EXISTS "freelancers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "taxNumber" TEXT,
    "vatId" TEXT,
    "tradeRegNumber" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "accountHolder" TEXT,
    "affiliateCode" TEXT NOT NULL,
    "tier" "FreelancerTier" NOT NULL DEFAULT 'STARTER',
    "region" TEXT,
    "contractStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractEndDate" TIMESTAMP(3),
    "status" "FreelancerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notifyNewBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifyLeadReminder" BOOLEAN NOT NULL DEFAULT true,
    "notifyBillingReady" BOOLEAN NOT NULL DEFAULT true,
    "notifyWorkshopWarning" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "freelancers_userId_key" ON "freelancers"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "freelancers_affiliateCode_key" ON "freelancers"("affiliateCode");

-- Step 3: Create FreelancerLead table
CREATE TABLE IF NOT EXISTS "freelancer_leads" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "workshopName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "status" "FreelancerLeadStatus" NOT NULL DEFAULT 'NEW',
    "lostReason" TEXT,
    "nextFollowUp" TIMESTAMP(3),
    "notes" TEXT,
    "workshopId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancer_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "freelancer_leads_freelancerId_idx" ON "freelancer_leads"("freelancerId");
CREATE INDEX IF NOT EXISTS "freelancer_leads_status_idx" ON "freelancer_leads"("status");

-- Step 4: Create FreelancerLeadActivity table
CREATE TABLE IF NOT EXISTS "freelancer_lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "FreelancerLeadActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancer_lead_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "freelancer_lead_activities_leadId_idx" ON "freelancer_lead_activities"("leadId");

-- Step 5: Create FreelancerCommission table
CREATE TABLE IF NOT EXISTS "freelancer_commissions" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "bookingAmount" DECIMAL(10,2) NOT NULL,
    "b24GrossCommission" DECIMAL(10,2) NOT NULL,
    "stripeFee" DECIMAL(10,2) NOT NULL,
    "b24NetCommission" DECIMAL(10,2) NOT NULL,
    "freelancerPercentage" DECIMAL(5,2) NOT NULL,
    "freelancerAmount" DECIMAL(10,2) NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancer_commissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "freelancer_commissions_freelancerId_idx" ON "freelancer_commissions"("freelancerId");
CREATE INDEX IF NOT EXISTS "freelancer_commissions_period_idx" ON "freelancer_commissions"("period");
CREATE INDEX IF NOT EXISTS "freelancer_commissions_workshopId_idx" ON "freelancer_commissions"("workshopId");

-- Step 6: Create FreelancerPayout table
CREATE TABLE IF NOT EXISTS "freelancer_payouts" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalBookings" INTEGER NOT NULL,
    "totalVolume" DECIMAL(12,2) NOT NULL,
    "totalCommission" DECIMAL(10,2) NOT NULL,
    "tier" "FreelancerTier" NOT NULL,
    "status" "FreelancerPayoutStatus" NOT NULL DEFAULT 'CALCULATED',
    "invoiceUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "statementUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancer_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "freelancer_payouts_freelancerId_idx" ON "freelancer_payouts"("freelancerId");
CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_payouts_freelancerId_period_key" ON "freelancer_payouts"("freelancerId", "period");

-- Step 7: Create FreelancerMaterial table
CREATE TABLE IF NOT EXISTS "freelancer_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancer_materials_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create FreelancerMaterialDownload table
CREATE TABLE IF NOT EXISTS "freelancer_material_downloads" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "freelancer_material_downloads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "freelancer_material_downloads_freelancerId_idx" ON "freelancer_material_downloads"("freelancerId");

-- Step 9: Add freelancer columns to workshops (if they don't exist)
DO $$ BEGIN
  ALTER TABLE "workshops" ADD COLUMN "freelancerId" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "workshops" ADD COLUMN "freelancerAcquiredAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Step 10: Add foreign keys
DO $$ BEGIN
  ALTER TABLE "freelancers" ADD CONSTRAINT "freelancers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_leads" ADD CONSTRAINT "freelancer_leads_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_leads" ADD CONSTRAINT "freelancer_leads_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_lead_activities" ADD CONSTRAINT "freelancer_lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "freelancer_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_commissions" ADD CONSTRAINT "freelancer_commissions_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_commissions" ADD CONSTRAINT "freelancer_commissions_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_payouts" ADD CONSTRAINT "freelancer_payouts_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_material_downloads" ADD CONSTRAINT "freelancer_material_downloads_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "freelancer_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancer_material_downloads" ADD CONSTRAINT "freelancer_material_downloads_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "workshops" ADD CONSTRAINT "workshops_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Done!
SELECT 'Freelancer Dashboard migration completed successfully!' AS result;
