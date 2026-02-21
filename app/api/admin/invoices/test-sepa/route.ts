import { NextRequest, NextResponse } from 'next/server'

/**
 * TEST 4: Initiate SEPA payment for latest invoice
 * 
 * ⚠️ DEPRECATED: Diese Route ist nicht mehr relevant!
 * Provisionen werden jetzt automatisch über Stripe abgezogen.
 * Keine SEPA-Lastschriften mehr nötig.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    deprecated: true,
    error: 'SEPA-Test nicht mehr verfügbar. Provisionen werden automatisch über Stripe abgezogen.',
    reason: 'Das System verwendet keine SEPA-Lastschriften mehr. Alle Provisionen werden automatisch von Stripe-Zahlungen abgezogen.'
  }, { status: 410 }) // 410 Gone
}
