-- CreateEnum
CREATE TYPE "InfluencerPlatform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'BLOG', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('PAGE_VIEW', 'REGISTRATION', 'ACCEPTED_OFFER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'PAYPAL');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "influencers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "registrationToken" TEXT,
    "registrationTokenExpiry" TIMESTAMP(3),
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "platform" "InfluencerPlatform",
    "channelName" TEXT,
    "channelUrl" TEXT,
    "additionalChannels" JSONB,
    "commissionPer1000Views" INTEGER NOT NULL DEFAULT 300,
    "commissionPerRegistration" INTEGER NOT NULL DEFAULT 1500,
    "commissionPerAcceptedOffer" INTEGER NOT NULL DEFAULT 2500,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" "PaymentMethod",
    "accountHolder" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "paypalEmail" TEXT,
    "taxType" "TaxType",
    "companyName" TEXT,
    "taxId" TEXT,
    "street" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Deutschland',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "cookieId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" TEXT,
    "country" TEXT,
    "city" TEXT,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_conversions" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "type" "ConversionType" NOT NULL,
    "cookieId" TEXT NOT NULL,
    "customerId" TEXT,
    "tireRequestId" TEXT,
    "offerId" TEXT,
    "commissionAmount" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_payments" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "clicksAmount" INTEGER NOT NULL,
    "registrationsAmount" INTEGER NOT NULL,
    "offersAmount" INTEGER NOT NULL,
    "totalClicks" INTEGER NOT NULL,
    "totalRegistrations" INTEGER NOT NULL,
    "totalOffers" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "affiliate_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "influencers_email_key" ON "influencers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_code_key" ON "influencers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_registrationToken_key" ON "influencers"("registrationToken");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_clicks_cookieId_key" ON "affiliate_clicks"("cookieId");

-- CreateIndex
CREATE INDEX "affiliate_clicks_influencerId_idx" ON "affiliate_clicks"("influencerId");

-- CreateIndex
CREATE INDEX "affiliate_clicks_cookieId_idx" ON "affiliate_clicks"("cookieId");

-- CreateIndex
CREATE INDEX "affiliate_clicks_clickedAt_idx" ON "affiliate_clicks"("clickedAt");

-- CreateIndex
CREATE INDEX "affiliate_conversions_influencerId_idx" ON "affiliate_conversions"("influencerId");

-- CreateIndex
CREATE INDEX "affiliate_conversions_customerId_idx" ON "affiliate_conversions"("customerId");

-- CreateIndex
CREATE INDEX "affiliate_conversions_cookieId_idx" ON "affiliate_conversions"("cookieId");

-- CreateIndex
CREATE INDEX "affiliate_conversions_convertedAt_idx" ON "affiliate_conversions"("convertedAt");

-- CreateIndex
CREATE INDEX "affiliate_conversions_isPaid_idx" ON "affiliate_conversions"("isPaid");

-- CreateIndex
CREATE INDEX "affiliate_payments_influencerId_idx" ON "affiliate_payments"("influencerId");

-- CreateIndex
CREATE INDEX "affiliate_payments_periodStart_periodEnd_idx" ON "affiliate_payments"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "affiliate_payments_status_idx" ON "affiliate_payments"("status");

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_tireRequestId_fkey" FOREIGN KEY ("tireRequestId") REFERENCES "tire_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "affiliate_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_payments" ADD CONSTRAINT "affiliate_payments_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
