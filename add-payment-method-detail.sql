-- Add payment_method_detail column to direct_bookings table if it doesn't exist
-- This stores the specific payment method used: card, google_pay, apple_pay, paypal, etc.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'direct_bookings' 
        AND column_name = 'payment_method_detail'
    ) THEN
        ALTER TABLE direct_bookings 
        ADD COLUMN payment_method_detail VARCHAR(50);
        
        RAISE NOTICE 'Column payment_method_detail added to direct_bookings';
    ELSE
        RAISE NOTICE 'Column payment_method_detail already exists';
    END IF;
END $$;

-- Set default values for existing records with STRIPE payment method
UPDATE direct_bookings 
SET payment_method_detail = 'card'
WHERE payment_method = 'STRIPE' 
  AND payment_method_detail IS NULL
  AND payment_status = 'PAID';

-- Log the update
DO $$
DECLARE
    updated_count INT;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM direct_bookings 
    WHERE payment_method_detail = 'card' 
      AND payment_method = 'STRIPE';
    
    RAISE NOTICE 'Updated % existing STRIPE payments to default "card"', updated_count;
END $$;
