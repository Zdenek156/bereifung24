ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS supplier_order_number TEXT;
ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS supplier_ordered_at TIMESTAMP;
ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS supplier_order_status TEXT;
ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS supplier_order_error TEXT;
