-- Migration: Fix DirectBooking customer relation
-- Change customerId from User.id to Customer.id

-- Step 1: Add temporary column for new customerId
ALTER TABLE "direct_bookings" ADD COLUMN "new_customer_id" TEXT;

-- Step 2: Create Customer records for all Users that have DirectBookings but no Customer record
INSERT INTO "customers" ("id", "user_id", "created_at", "updated_at")
SELECT 
  gen_random_uuid(),
  u.id,
  NOW(),
  NOW()
FROM "users" u
INNER JOIN "direct_bookings" db ON db.customer_id = u.id
LEFT JOIN "customers" c ON c.user_id = u.id
WHERE c.id IS NULL;

-- Step 3: Update DirectBooking.new_customer_id to point to Customer.id instead of User.id
UPDATE "direct_bookings" db
SET "new_customer_id" = c.id
FROM "customers" c
INNER JOIN "users" u ON c.user_id = u.id
WHERE db.customer_id = u.id;

-- Step 4: Drop old foreign key constraint
ALTER TABLE "direct_bookings" DROP CONSTRAINT IF EXISTS "direct_bookings_customer_id_fkey";

-- Step 5: Drop old customerId column
ALTER TABLE "direct_bookings" DROP COLUMN "customer_id";

-- Step 6: Rename new_customer_id to customer_id
ALTER TABLE "direct_bookings" RENAME COLUMN "new_customer_id" TO "customer_id";

-- Step 7: Make customer_id NOT NULL
ALTER TABLE "direct_bookings" ALTER COLUMN "customer_id" SET NOT NULL;

-- Step 8: Add new foreign key constraint to Customer table
ALTER TABLE "direct_bookings" ADD CONSTRAINT "direct_bookings_customer_id_fkey" 
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Create index on customer_id
CREATE INDEX IF NOT EXISTS "direct_bookings_customer_id_idx" ON "direct_bookings"("customer_id");
