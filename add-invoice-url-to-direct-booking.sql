-- Add invoice_url field to direct_bookings table
ALTER TABLE direct_bookings 
ADD COLUMN invoice_url VARCHAR(500),
ADD COLUMN invoice_uploaded_at TIMESTAMP,
ADD COLUMN invoice_requested_at TIMESTAMP;

-- Add comment
COMMENT ON COLUMN direct_bookings.invoice_url IS 'URL to uploaded invoice PDF';
COMMENT ON COLUMN direct_bookings.invoice_uploaded_at IS 'When workshop uploaded the invoice';
COMMENT ON COLUMN direct_bookings.invoice_requested_at IS 'When customer requested the invoice';
