-- Create Payment tracking table (customer payments to workshop)
-- TSA-konform: Kunde zahlt direkt an Werkstatt
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "stripePaymentId" TEXT,
    "klarnaOrderId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "payments_bookingId_idx" ON "payments"("bookingId" ASC);
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status" ASC);
CREATE INDEX IF NOT EXISTS "payments_method_idx" ON "payments"("method" ASC);
CREATE UNIQUE INDEX IF NOT EXISTS "payments_transactionId_key" ON "payments"("transactionId" ASC) WHERE "transactionId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_paypalOrderId_key" ON "payments"("paypalOrderId" ASC) WHERE "paypalOrderId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripePaymentId_key" ON "payments"("stripePaymentId" ASC) WHERE "stripePaymentId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_klarnaOrderId_key" ON "payments"("klarnaOrderId" ASC) WHERE "klarnaOrderId" IS NOT NULL;

-- Add foreign key
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" 
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
