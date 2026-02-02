-- Add cascade delete for Offer -> TireRequest relation
-- This allows deleting tire requests that have offers

ALTER TABLE "offers" 
DROP CONSTRAINT IF EXISTS "offers_tireRequestId_fkey";

ALTER TABLE "offers" 
ADD CONSTRAINT "offers_tireRequestId_fkey" 
FOREIGN KEY ("tireRequestId") 
REFERENCES "tire_requests"("id") 
ON DELETE CASCADE;

-- Verify the constraint
SELECT 
    con.conname AS constraint_name,
    con.confdeltype AS delete_action
FROM pg_constraint con
WHERE con.conname = 'offers_tireRequestId_fkey';

-- Expected output: delete_action should be 'c' (CASCADE)
