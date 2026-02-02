import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'

/**
 * Get Stripe instance with keys from database
 */
async function getStripeInstance() {
  const secretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
  
  if (!secretKey) {
    throw new Error('Stripe Secret Key not configured. Please add it in Admin > API Settings.')
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  })
}

/**
 * POST /api/payments/stripe
 * Create a PaymentIntent for Stripe payment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, amount } = await req.json()

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing bookingId or amount' },
        { status: 400 }
      )
    }

    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: session.user.id,
      },
      include: {
        workshop: {
          select: {
            companyName: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if already paid
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Booking already paid' },
        { status: 400 }
      )
    }

    // Create PaymentIntent
    const stripe = await getStripeInstance()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId,
        customerId: session.user.id,
        workshopName: booking.workshop.companyName,
      },
      description: `Terminbuchung bei ${booking.workshop.companyName}`,
    })

    // Create Payment record
    await prisma.payment.create({
      data: {
        bookingId,
        amount: amount,
        currency: 'EUR',
        method: 'CARD',
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
        transactionId: paymentIntent.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Stripe PaymentIntent creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/payments/stripe
 * Confirm payment success (called by webhook or frontend)
 */
export async function PUT(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId' },
        { status: 400 }
      )
    }

    // Retrieve PaymentIntent from Stripe
    const stripe = await getStripeInstance()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not successful', status: paymentIntent.status },
        { status: 400 }
      )
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: paymentIntentId,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment and booking
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          confirmedAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'CREDIT_CARD',
          paidAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
    })
  } catch (error: any) {
    console.error('Stripe payment confirmation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
