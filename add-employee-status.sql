-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EmployeeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PROBATION', 'TERMINATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "b24_employees" ADD COLUMN IF NOT EXISTS "status" "EmployeeStatus" DEFAULT 'ACTIVE';

-- Update existing employees to ACTIVE status
UPDATE "b24_employees" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Make status NOT NULL
ALTER TABLE "b24_employees" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "b24_employees" ALTER COLUMN "status" SET NOT NULL;
