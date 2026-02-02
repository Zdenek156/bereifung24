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

    // Verify booking belongs to user (check via customer relation)
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tireRequest: {
          is: {
            customer: {
              is: {
                userId: session.user.id
              }
            }
          }
        }
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        workshop: {
          select: {
            companyName: true,
          },
        },
        tireRequest: true
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Check if already paid
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Booking already paid' },
        { status: 400 }
      )
    }

    // Calculate Stripe fee and add to amount
    // Stripe EU: 1.5% + €0.25
    const stripeFeePercent = 0.015 // 1.5%
    const stripeFeeFixed = 0.25 // €0.25
    const stripeFee = (amount * stripeFeePercent) + stripeFeeFixed
    const totalAmount = amount + stripeFee

    // Get customer data for billing details
    const user = booking.customer?.user
    const firstName = user?.firstName || booking.tireRequest?.firstName || ''
    const lastName = user?.lastName || booking.tireRequest?.lastName || ''
    const street = user?.street || booking.tireRequest?.street || ''
    const city = user?.city || booking.tireRequest?.city || ''
    const postalCode = user?.postalCode || user?.zipCode || booking.tireRequest?.postalCode || booking.tireRequest?.zipCode || ''
    const email = user?.email || ''

    // Create Checkout Session with customer address
    const stripe = await getStripeInstance()
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal', 'klarna', 'giropay', 'sofort', 'eps', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Terminbuchung bei ${booking.workshop.companyName}`,
              description: `Booking ID: B24-${bookingId.substring(0, 8).toUpperCase()}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents, includes Stripe fee
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/appointments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/requests/${booking.tireRequestId}/book?offerId=${booking.offerId}&payment=cancelled`,
      customer_email: email,
      ...(street && city && {
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['DE'],
        },
      }),
      metadata: {
        bookingId,
        customerId: session.user.id,
        workshopName: booking.workshop.companyName,
        invoiceId: `B24-${bookingId.substring(0, 8).toUpperCase()}`,
        originalAmount: amount.toFixed(2),
        stripeFee: stripeFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      },
    })

    // Create Payment record
    await prisma.payment.create({
      data: {
        bookingId,
        amount: totalAmount, // Store total amount including fee
        currency: 'EUR',
        method: 'CARD',
        status: 'PENDING',
        stripePaymentId: checkoutSession.id,
        transactionId: checkoutSession.id,
      },
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
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
 * Confirm payment success (called by webhook or frontend after Checkout Session)
 */
export async function PUT(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    // Retrieve Checkout Session from Stripe
    const stripe = await getStripeInstance()
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not successful', status: checkoutSession.payment_status },
        { status: 400 }
      )
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: sessionId,
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
