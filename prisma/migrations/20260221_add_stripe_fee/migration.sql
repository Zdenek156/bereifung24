-- Add stripeFee column to DirectBooking table
-- This stores the actual Stripe fee from Balance Transaction
ALTER TABLE "direct_bookings" ADD COLUMN "stripe_fee" DECIMAL(10,2);
