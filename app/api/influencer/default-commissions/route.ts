import { NextResponse } from 'next/server'

/**
 * GET /api/influencer/default-commissions
 * Get default commission rates for displaying on landing page
 */
export async function GET() {
  try {
    // These are the default rates shown on the landing page
    // Admins can set individual rates per influencer
    const defaultCommissions = {
      per1000Views: 300,      // €3.00
      perRegistration: 1500,   // €15.00
      perAcceptedOffer: 2500   // €25.00
    }

    return NextResponse.json({
      commissions: defaultCommissions
    })

  } catch (error) {
    console.error('[INFLUENCER] Default commissions error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Provisionen' },
      { status: 500 }
    )
  }
}
