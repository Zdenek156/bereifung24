-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PROBATION', 'TERMINATED');

-- AlterTable
ALTER TABLE "b24_employees" ADD COLUMN "status" "EmployeeStatus" DEFAULT 'DRAFT';

-- Update existing employees to ACTIVE status
UPDATE "b24_employees" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Make status NOT NULL
ALTER TABLE "b24_employees" ALTER COLUMN "status" SET NOT NULL;
