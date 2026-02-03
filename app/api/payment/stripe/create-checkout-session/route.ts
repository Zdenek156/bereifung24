import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Only import Stripe if key is available
let stripe: any = null
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe')
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia'
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert' },
        { status: 503 }
      )
    }

    const { reservationId, serviceType, workshopName, amount } = await request.json()

    if (!reservationId || !serviceType || !amount) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${serviceType} - ${workshopName}`,
              description: 'Direkt-Buchung'
            },
            unit_amount: Math.round(amount * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking?canceled=true`,
      metadata: {
        reservationId,
        customerId: session.user.id
      }
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Checkout-Session' },
      { status: 500 }
    )
  }
}
