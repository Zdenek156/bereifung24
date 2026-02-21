-- Check if ENUM types exist
SELECT typname FROM pg_type WHERE typname = 'DirectBookingPaymentStatus';
SELECT typname FROM pg_type WHERE typname = 'DirectBookingPaymentMethod';

-- If they don't exist, create them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DirectBookingPaymentStatus') THEN
        CREATE TYPE "DirectBookingPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DirectBookingPaymentMethod') THEN
        CREATE TYPE "DirectBookingPaymentMethod" AS ENUM ('STRIPE', 'PAYPAL');
    END IF;
END $$;

-- Verify column type
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'direct_bookings' 
  AND column_name IN ('payment_status', 'payment_method');
