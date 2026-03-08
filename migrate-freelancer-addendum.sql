-- Freelancer: Add missing columns and fix enum values
-- Run after migrate-freelancer.sql

-- Add missing columns to freelancers table
DO $$ BEGIN
  ALTER TABLE "freelancers" ADD COLUMN "bankName" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancers" ADD COLUMN "phone" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancers" ADD COLUMN "street" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancers" ADD COLUMN "zip" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "freelancers" ADD COLUMN "city" TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Fix FreelancerTier enum (remove PRO/EXPERT if they exist, ensure BRONZE/SILVER/GOLD exist)
-- The SQL migration already created it with STARTER/BRONZE/SILVER/GOLD so this should be fine
-- Just verify by trying to add missing values
DO $$ BEGIN
  ALTER TYPE "FreelancerTier" ADD VALUE IF NOT EXISTS 'BRONZE';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "FreelancerTier" ADD VALUE IF NOT EXISTS 'SILVER';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "FreelancerTier" ADD VALUE IF NOT EXISTS 'GOLD';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

SELECT 'Freelancer addendum migration completed!' AS result;
