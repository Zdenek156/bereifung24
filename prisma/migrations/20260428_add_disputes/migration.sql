-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "stripe_dispute_id" TEXT NOT NULL,
    "stripe_charge_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "direct_booking_id" TEXT,
    "workshop_id" TEXT,
    "customer_id" TEXT,
    "booking_date" DATE,
    "booking_time" VARCHAR(5),
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'eur',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "evidence_due_by" TIMESTAMP(3),
    "dispute_created_at" TIMESTAMP(3) NOT NULL,
    "liability" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "outcome" TEXT,
    "funds_withdrawn_at" TIMESTAMP(3),
    "funds_reinstated_at" TIMESTAMP(3),
    "internal_notes" TEXT,
    "evidence_submitted_at" TIMESTAMP(3),
    "handled_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disputes_stripe_dispute_id_key" ON "disputes"("stripe_dispute_id");
CREATE INDEX "disputes_status_idx" ON "disputes"("status");
CREATE INDEX "disputes_liability_idx" ON "disputes"("liability");
CREATE INDEX "disputes_workshop_id_idx" ON "disputes"("workshop_id");
CREATE INDEX "disputes_direct_booking_id_idx" ON "disputes"("direct_booking_id");
CREATE INDEX "disputes_evidence_due_by_idx" ON "disputes"("evidence_due_by");
CREATE INDEX "disputes_dispute_created_at_idx" ON "disputes"("dispute_created_at");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_direct_booking_id_fkey"
  FOREIGN KEY ("direct_booking_id") REFERENCES "direct_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
