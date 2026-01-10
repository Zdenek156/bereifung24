-- Create ProvisionType enum
CREATE TYPE "ProvisionType" AS ENUM (
  'TAX',
  'VACATION',
  'WARRANTY',
  'LEGAL',
  'RESTRUCTURING',
  'PENSION',
  'OTHER'
);

-- Update existing provisions to use valid enum values (if any exist)
UPDATE "Provision" SET type = 'OTHER' WHERE type NOT IN ('TAX', 'VACATION', 'WARRANTY', 'LEGAL', 'RESTRUCTURING', 'PENSION', 'OTHER');

-- Change column type from TEXT to ProvisionType enum
ALTER TABLE "Provision" ALTER COLUMN "type" TYPE "ProvisionType" USING type::"ProvisionType";
