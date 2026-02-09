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

    const { workshopId, date, time, serviceType, vehicleId, totalPrice, basePrice, balancingPrice, storagePrice, hasBalancing, hasStorage, workshopName, serviceName, vehicleInfo } = await request.json()

    // Get Stripe keys from database
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    const stripeMode = await getApiSetting('STRIPE_MODE', 'STRIPE_MODE') || 'test'

    if (!stripeSecretKey) {
      console.error('[STRIPE] Missing secret key in database!')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Get workshop's Stripe Account ID
    const { prisma } = await import('@/lib/prisma')
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { stripeAccountId: true, stripeEnabled: true, companyName: true }
    })

    if (!workshop?.stripeEnabled || !workshop?.stripeAccountId) {
      console.error('[STRIPE] Workshop Stripe not configured:', workshopId)
      return NextResponse.json({ 
        error: 'Diese Werkstatt akzeptiert keine Stripe-Zahlungen. Bitte wählen Sie eine andere Zahlungsmethode.' 
      }, { status: 400 })
    }

    console.log('[STRIPE] Creating session with mode:', stripeMode)
    console.log('[STRIPE] Payment goes directly to workshop:', workshop.stripeAccountId)

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    // Service type labels
    const serviceLabels: Record<string, string> = {
      TIRE_CHANGE: 'Reifenwechsel',
      BALANCING: 'Auswuchten',
      STORAGE: 'Einlagerung',
    }

    // Create Stripe Checkout Session with Direct Charges to Workshop
    // Payment goes 100% to workshop (no platform fee)
    // Automatically shows all payment methods enabled in Stripe Dashboard
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Start with card, others will be added via automatic_payment_methods
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${serviceName || serviceLabels[serviceType] || serviceType} bei ${workshop.companyName}`,
              description: vehicleInfo || 'Fahrzeug',
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: session.user.email || undefined,
      
      // Enable all payment methods configured in Stripe Dashboard
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Allow redirect-based methods like Giropay, SOFORT
      },
      
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/direct-booking/success?session_id={CHECKOUT_SESSION_ID}&payment_method=STRIPE`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/direct-booking/checkout`,
      
      // Stripe Connect: Payment goes directly to workshop's account
      payment_intent_data: {
        on_behalf_of: workshop.stripeAccountId, // Workshop receives 100% of payment
        transfer_data: {
          destination: workshop.stripeAccountId, // Direct to workshop
        },
      },
      
      metadata: {
        workshopId,
        workshopName: workshop.companyName,
        customerId: session.user.id,
        date,
        time,
        serviceType,
        vehicleId,
        basePrice: basePrice?.toString() || '0',
        balancingPrice: balancingPrice?.toString() || '0',
        storagePrice: storagePrice?.toString() || '0',
        totalPrice: totalPrice.toString(),
        hasBalancing: hasBalancing?.toString() || 'false',
        hasStorage: hasStorage?.toString() || 'false',
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
