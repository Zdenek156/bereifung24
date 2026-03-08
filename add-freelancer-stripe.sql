-- Add Stripe Connect columns to freelancers table
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN NOT NULL DEFAULT false;
