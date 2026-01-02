-- Rename commission columns in influencers table to match new Prisma schema
ALTER TABLE influencers 
  RENAME COLUMN "commissionPerCustomerRegistration" TO "commissionPerRegistration";

ALTER TABLE influencers 
  RENAME COLUMN "commissionPerCustomerFirstOffer" TO "commissionPerAcceptedOffer";
