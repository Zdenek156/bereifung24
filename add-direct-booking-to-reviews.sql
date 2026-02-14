-- Add directBookingId column to reviews table
ALTER TABLE reviews 
  ADD COLUMN "directBookingId" TEXT UNIQUE,
  ALTER COLUMN "bookingId" DROP NOT NULL;

-- Add foreign key constraint
ALTER TABLE reviews
  ADD CONSTRAINT "reviews_directBookingId_fkey" 
  FOREIGN KEY ("directBookingId") 
  REFERENCES direct_bookings(id) 
  ON DELETE RESTRICT ON UPDATE CASCADE;
