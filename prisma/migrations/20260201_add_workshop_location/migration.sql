-- Add location and service area fields to workshops table
ALTER TABLE "workshops" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "workshops" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "workshops" ADD COLUMN "service_radius" INTEGER DEFAULT 25;
ALTER TABLE "workshops" ADD COLUMN "status" TEXT DEFAULT 'PENDING';
ALTER TABLE "workshops" ADD COLUMN "approved" BOOLEAN DEFAULT false;
