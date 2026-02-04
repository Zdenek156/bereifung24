import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workshopId,
      serviceType,
      vehicleId,
      date,
      time,
      hasBalancing,
      hasStorage,
      totalPrice,
      workshopName,
      serviceName,
      vehicleInfo
    } = body

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${serviceName} - ${workshopName}`,
              description: `Termin: ${new Date(date).toLocaleDateString('de-DE')} um ${time} Uhr\nFahrzeug: ${vehicleInfo}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/checkout?workshopId=${workshopId}&service=${serviceType}&cancelled=true`,
      customer_email: session.user.email!,
      metadata: {
        userId: session.user.id,
        workshopId,
        serviceType,
        vehicleId,
        date,
        time,
        hasBalancing: hasBalancing ? 'true' : 'false',
        hasStorage: hasStorage ? 'true' : 'false',
        totalPrice: totalPrice.toString()
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
