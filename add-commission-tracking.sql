-- Migration: Add commission tracking fields to DirectBooking
-- Date: 2026-02-17
-- Description: Adds fields to track platform commission (6.9%), workshop payout, and Stripe fees

ALTER TABLE direct_bookings
ADD COLUMN platform_commission DECIMAL(10, 2) NULL COMMENT '6.9% commission for platform',
ADD COLUMN platform_commission_cents INT NULL COMMENT 'Application fee in cents for Stripe API',
ADD COLUMN workshop_payout DECIMAL(10, 2) NULL COMMENT 'Amount workshop receives (93.1% of total)',
ADD COLUMN stripe_fees_estimate DECIMAL(10, 2) NULL COMMENT 'Estimated Stripe fees (deducted from commission)',
ADD COLUMN platform_net_commission DECIMAL(10, 2) NULL COMMENT 'Net commission after Stripe fees deducted';

-- Add index for commission queries
CREATE INDEX idx_direct_bookings_platform_commission ON direct_bookings(platform_commission, payment_status);

-- Backfill existing paid bookings (optional - calculate commission retroactively)
-- UPDATE direct_bookings
-- SET 
--   platform_commission = ROUND(total_price * 0.069, 2),
--   platform_commission_cents = ROUND(total_price * 100 * 0.069),
--   workshop_payout = ROUND(total_price * 0.931, 2),
--   stripe_fees_estimate = ROUND((total_price * 0.015) + 0.25, 2),
--   platform_net_commission = ROUND((total_price * 0.069) - ((total_price * 0.015) + 0.25), 2)
-- WHERE payment_status = 'PAID' AND platform_commission IS NULL;

-- Verify migration
SELECT 
  COUNT(*) as total_bookings,
  SUM(total_price) as total_revenue,
  SUM(platform_commission) as total_commission,
  SUM(workshop_payout) as total_workshop_payout,
  SUM(stripe_fees_estimate) as total_stripe_fees,
  SUM(platform_net_commission) as total_net_commission
FROM direct_bookings
WHERE payment_status = 'PAID';
