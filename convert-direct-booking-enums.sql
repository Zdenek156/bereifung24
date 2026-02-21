-- Convert payment_status from text to ENUM
ALTER TABLE direct_bookings 
ALTER COLUMN payment_status TYPE "DirectBookingPaymentStatus" 
USING payment_status::"DirectBookingPaymentStatus";

-- Convert payment_method from text to ENUM
ALTER TABLE direct_bookings 
ALTER COLUMN payment_method TYPE "DirectBookingPaymentMethod" 
USING payment_method::"DirectBookingPaymentMethod";

-- Verify the change
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'direct_bookings' 
  AND column_name IN ('payment_status', 'payment_method');
