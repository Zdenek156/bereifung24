-- Fix workshop columns: rename from camelCase to snake_case to match Prisma @map
ALTER TABLE workshops RENAME COLUMN "freelancerId" TO freelancer_id;
ALTER TABLE workshops RENAME COLUMN "freelancerAcquiredAt" TO freelancer_acquired_at;
