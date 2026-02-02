-- Add Stripe fields to Workshop model
ALTER TABLE "workshops" ADD COLUMN "stripe_account_id" TEXT;
ALTER TABLE "workshops" ADD COLUMN "stripe_enabled" BOOLEAN NOT NULL DEFAULT false;
