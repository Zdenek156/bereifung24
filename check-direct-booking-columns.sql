-- Check direct_bookings table columns
\d direct_bookings

-- Check if commission_billed_at exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'direct_bookings' 
  AND column_name = 'commission_billed_at';
