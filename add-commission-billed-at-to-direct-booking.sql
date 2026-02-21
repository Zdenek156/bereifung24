-- Add commissionBilledAt field to DirectBooking table
-- This field tracks when a DirectBooking's commission was included in a monthly invoice
ALTER TABLE direct_bookings 
ADD COLUMN commission_billed_at TIMESTAMP;

-- Add index for faster queries
CREATE INDEX idx_direct_bookings_commission_billed_at 
ON direct_bookings(commission_billed_at);

-- Add comment for documentation
COMMENT ON COLUMN direct_bookings.commission_billed_at IS 'Timestamp when this booking''s commission was included in a monthly commission invoice';
