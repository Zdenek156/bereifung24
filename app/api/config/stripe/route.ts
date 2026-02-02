import { NextRequest, NextResponse } from 'next/server'
import { getApiSetting } from '@/lib/api-settings'

/**
 * GET /api/config/stripe
 * Get Stripe publishable key (safe to expose to frontend)
 */
export async function GET(req: NextRequest) {
  try {
    const publishableKey = await getApiSetting('STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    
    if (!publishableKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      publishableKey,
    })
  } catch (error: any) {
    console.error('Error fetching Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to load Stripe configuration' },
      { status: 500 }
    )
  }
}
