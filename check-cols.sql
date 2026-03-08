SELECT column_name FROM information_schema.columns WHERE table_name = 'direct_bookings' AND column_name LIKE 'supplier%' ORDER BY column_name;
