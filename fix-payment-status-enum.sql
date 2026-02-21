-- Remove default constraint temporarily
ALTER TABLE direct_bookings 
ALTER COLUMN payment_status DROP DEFAULT;

-- Convert payment_status from text to ENUM
ALTER TABLE direct_bookings 
ALTER COLUMN payment_status TYPE "DirectBookingPaymentStatus" 
USING payment_status::"DirectBookingPaymentStatus";

-- Re-add default
ALTER TABLE direct_bookings 
ALTER COLUMN payment_status SET DEFAULT 'PENDING'::"DirectBookingPaymentStatus";

-- Verify the change
SELECT column_name, data_type, udt_name, column_default
FROM information_schema.columns 
WHERE table_name = 'direct_bookings' 
  AND column_name IN ('payment_status', 'payment_method');
