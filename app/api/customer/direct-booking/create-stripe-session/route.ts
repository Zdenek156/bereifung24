import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workshopId, date, time, serviceType, vehicle, totalPrice, basePrice, balancingPrice, storagePrice } = await request.json()

    // Get Stripe keys from database
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    const stripeMode = await getApiSetting('STRIPE_MODE', 'STRIPE_MODE') || 'test'

    if (!stripeSecretKey) {
      console.error('[STRIPE] Missing secret key in database!')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    console.log('[STRIPE] Creating session with mode:', stripeMode)

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    // Service type labels
    const serviceLabels: Record<string, string> = {
      TIRE_CHANGE: 'Reifenwechsel',
      BALANCING: 'Auswuchten',
      STORAGE: 'Einlagerung',
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: serviceLabels[serviceType] || serviceType,
              description: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/direct-booking/success?session_id={CHECKOUT_SESSION_ID}&payment_method=STRIPE`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/direct-booking/checkout`,
      metadata: {
        workshopId,
        customerId: session.user.id,
        date,
        time,
        serviceType,
        vehicleId: vehicle.id,
        basePrice: basePrice.toString(),
        balancingPrice: balancingPrice?.toString() || '0',
        storagePrice: storagePrice?.toString() || '0',
        totalPrice: totalPrice.toString(),
      },
    })

    console.log('[STRIPE] Checkout session created:', checkoutSession.id)

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('[STRIPE] Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
