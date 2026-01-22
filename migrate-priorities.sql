-- Migration: Simplify RoadmapTaskPriority enum
-- Change from P0_CRITICAL/P1_HIGH/P2_MEDIUM/P3_LOW to P0/P1/P2/P3

BEGIN;

-- Rename old enum
ALTER TYPE "RoadmapTaskPriority" RENAME TO "RoadmapTaskPriority_old";

-- Create new enum with simplified values
CREATE TYPE "RoadmapTaskPriority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- Update column with conversion
ALTER TABLE "RoadmapTask" 
  ALTER COLUMN priority TYPE "RoadmapTaskPriority" 
  USING (
    CASE priority::text 
      WHEN 'P0_CRITICAL' THEN 'P0'::text
      WHEN 'P1_HIGH' THEN 'P1'::text
      WHEN 'P2_MEDIUM' THEN 'P2'::text
      WHEN 'P3_LOW' THEN 'P3'::text
      ELSE 'P2'::text -- Default to P2 for any unknown values
    END
  )::"RoadmapTaskPriority";

-- Drop old enum
DROP TYPE "RoadmapTaskPriority_old";

COMMIT;
