-- Coupon System: Gutschein-Verwaltung für Bereifung24
-- Erstellt: 2026-03-08

-- 1. Coupon-Tabelle
CREATE TABLE IF NOT EXISTS "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "min_order_value" DOUBLE PRECISION,
  "max_discount" DOUBLE PRECISION,
  "max_usages" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "max_usages_per_user" INTEGER NOT NULL DEFAULT 1,
  "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "valid_until" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_is_active_idx" ON "coupons"("is_active");

-- 2. Coupon-Nutzungs-Tabelle
CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id" TEXT NOT NULL,
  "coupon_id" TEXT NOT NULL,
  "customer_id" TEXT,
  "booking_id" TEXT,
  "original_amount" DOUBLE PRECISION NOT NULL,
  "discount_amount" DOUBLE PRECISION NOT NULL,
  "final_amount" DOUBLE PRECISION NOT NULL,
  "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");
CREATE INDEX IF NOT EXISTS "coupon_usages_customer_id_idx" ON "coupon_usages"("customer_id");

-- Foreign Key
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" 
  FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Application-Eintrag für Admin-Dashboard
INSERT INTO "Application" ("id", "key", "name", "description", "icon", "adminRoute", "color", "sortOrder", "isActive", "category", "createdAt", "updatedAt")
VALUES (
  'cm_gutscheine_app_001',
  'gutscheine',
  'Gutschein-Verwaltung',
  'Gutscheincodes erstellen, verwalten und Nutzung nachverfolgen',
  'Gift',
  '/admin/gutscheine',
  'green',
  55,
  true,
  'SALES',
  NOW(),
  NOW()
)
ON CONFLICT ("key") DO NOTHING;

SELECT 'Coupon system migration completed successfully' AS result;
