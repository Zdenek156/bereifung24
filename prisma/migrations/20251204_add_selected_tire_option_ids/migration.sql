-- AlterTable
ALTER TABLE "offers" ADD COLUMN "selected_tire_option_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
