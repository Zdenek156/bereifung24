import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import { getAuthUser } from '@/lib/getAuthUser'
import Stripe from 'stripe'

/**
 * POST /api/payment/stripe/create-payment-intent
 * Creates a Stripe PaymentIntent for mobile app payments (Flutter Stripe SDK).
 * Returns clientSecret for Stripe Payment Sheet.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { bookingId, amount, currency = 'eur' } = await request.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Fehlende oder ungültige Parameter (amount)' },
        { status: 400 }
      )
    }

    // For direct bookings (bookingId starts with 'pending_'), skip booking verification
    const isDirectBooking = !bookingId || bookingId.startsWith('pending_')

    if (!isDirectBooking) {
      // Verify existing booking belongs to user
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          tireRequest: {
            is: {
              customer: {
                is: {
                  userId: authUser.id
                }
              }
            }
          }
        },
        include: {
          workshop: { select: { companyName: true } },
          tireRequest: true,
        },
      })

      if (!booking) {
        return NextResponse.json(
          { error: 'Buchung nicht gefunden oder nicht berechtigt' },
          { status: 404 }
        )
      }

      if (booking.paymentStatus === 'PAID') {
        return NextResponse.json(
          { error: 'Buchung bereits bezahlt' },
          { status: 400 }
        )
      }
    }

    // Get Stripe key from database
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    // Calculate amount in cents
    const amountInCents = Math.round(amount * 100)

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId,
        userId: authUser.id,
        source: 'mobile_app',
      },
      description: `Bereifung24 - ${isDirectBooking ? 'Direktbuchung' : 'Buchung ' + bookingId}`,
    })

    // Create Payment record in DB (only for existing bookings, not direct bookings)
    if (!isDirectBooking) {
      await prisma.payment.create({
        data: {
          bookingId,
          amount,
          currency: currency.toUpperCase(),
          method: 'CARD',
          status: 'PENDING',
          stripePaymentId: paymentIntent.id,
          metadata: { source: 'mobile_app', userId: authUser.id },
        },
      })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency,
    })
  } catch (error: any) {
    console.error('❌ PaymentIntent creation failed:', error)
    return NextResponse.json(
      { error: 'Zahlung konnte nicht erstellt werden' },
      { status: 500 }
    )
  }
}
