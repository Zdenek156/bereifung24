import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'

/**
 * Stripe Webhook Handler
 * Receives notifications from Stripe about payment events
 * 
 * Setup: Add this URL to Stripe webhook settings:
 * https://bereifung24.de/api/webhooks/stripe
 * 
 * Events to subscribe:
 * - checkout.session.completed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 * - account.updated (for Stripe Connect)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ No Stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 401 })
    }

    // Get Stripe keys from database
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    const webhookSecret = await getApiSetting('STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey || !webhookSecret) {
      console.error('❌ Stripe keys not configured')
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('📬 Stripe Webhook received:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log('ℹ️  Unhandled Stripe event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Stripe webhook error:', error)
    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Handle successful checkout session
 * This is called when customer completes payment
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('✅ Checkout completed:', session.id)

    const workshopId = session.metadata?.workshopId
    const customerId = session.metadata?.customerId
    const date = session.metadata?.date
    const time = session.metadata?.time
    const serviceType = session.metadata?.serviceType
    const vehicleId = session.metadata?.vehicleId
    const totalPrice = parseFloat(session.metadata?.totalPrice || '0')

    if (!workshopId || !customerId || !date || !time) {
      console.error('❌ Missing required metadata in checkout session')
      return
    }

    // Check if DirectBooking already exists
    const existingBooking = await prisma.directBooking.findFirst({
      where: {
        workshopId,
        customerId,
        date: new Date(date),
        time,
        stripeSessionId: session.id
      }
    })

    if (existingBooking) {
      console.log('ℹ️  DirectBooking already exists, updating payment status')
      await prisma.directBooking.update({
        where: { id: existingBooking.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'STRIPE',
          stripePaymentId: session.payment_intent as string,
          paidAt: new Date(),
          status: 'CONFIRMED'
        }
      })
      console.log('✅ DirectBooking updated:', existingBooking.id)
    } else {
      // Create DirectBooking record
      const booking = await prisma.directBooking.create({
        data: {
          workshopId,
          customerId,
          vehicleId: vehicleId!,
          serviceType: serviceType!,
          date: new Date(date),
          time,
          basePrice: parseFloat(session.metadata?.basePrice || '0'),
          balancingPrice: session.metadata?.balancingPrice ? parseFloat(session.metadata.balancingPrice) : null,
          storagePrice: session.metadata?.storagePrice ? parseFloat(session.metadata.storagePrice) : null,
          totalPrice,
          hasBalancing: session.metadata?.hasBalancing === 'true',
          hasStorage: session.metadata?.hasStorage === 'true',
          durationMinutes: 60, // Default
          status: 'CONFIRMED',
          paymentMethod: 'STRIPE',
          paymentStatus: 'PAID',
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          paidAt: new Date()
        }
      })

      console.log('✅ DirectBooking created:', booking.id)

      // TODO: Send confirmation emails to customer and workshop
    }
  } catch (error) {
    console.error('❌ Error handling checkout completion:', error)
    throw error
  }
}

/**
 * Handle successful payment intent
 * This confirms the money has been transferred
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('✅ Payment succeeded:', paymentIntent.id)

    // Update payment record
    await prisma.directBooking.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED'
      }
    })

    console.log('✅ Payment confirmed for booking')
  } catch (error) {
    console.error('❌ Error handling payment success:', error)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id)

    // Update payment record
    await prisma.directBooking.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED'
      }
    })

    console.log('✅ Booking cancelled due to payment failure')
  } catch (error) {
    console.error('❌ Error handling payment failure:', error)
  }
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    console.log('💰 Charge refunded:', charge.id)

    // Find booking by payment intent
    const paymentIntentId = typeof charge.payment_intent === 'string' 
      ? charge.payment_intent 
      : charge.payment_intent?.id

    if (!paymentIntentId) {
      console.error('❌ No payment intent found in charge')
      return
    }

    await prisma.directBooking.updateMany({
      where: { stripePaymentId: paymentIntentId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED'
      }
    })

    console.log('✅ Booking refunded')
  } catch (error) {
    console.error('❌ Error handling refund:', error)
  }
}

/**
 * Handle Stripe Connect account updates
 * Automatically activates workshop when account is verified
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log('🔄 Stripe Connect account updated:', account.id)

    // Check if account is fully verified and ready to accept payments
    const isVerified = account.charges_enabled && account.payouts_enabled
    const requirementsCurrentlyDue = account.requirements?.currently_due || []
    const hasRequirements = requirementsCurrentlyDue.length > 0

    console.log('  charges_enabled:', account.charges_enabled)
    console.log('  payouts_enabled:', account.payouts_enabled)
    console.log('  requirements:', requirementsCurrentlyDue)

    // Find workshop by Stripe Account ID
    const workshop = await prisma.workshop.findFirst({
      where: { stripeAccountId: account.id }
    })

    if (!workshop) {
      console.log('⚠️  No workshop found for Stripe account:', account.id)
      return
    }

    // Update workshop status based on account verification
    if (isVerified && !hasRequirements) {
      // Account is fully verified - enable Stripe payments
      if (!workshop.stripeEnabled) {
        await prisma.workshop.update({
          where: { id: workshop.id },
          data: { stripeEnabled: true }
        })
        console.log('✅ Stripe activated for workshop:', workshop.companyName)
        console.log('   Klarna, Card, and Bank Transfer payments are now available!')
      } else {
        console.log('ℹ️  Stripe already enabled for workshop:', workshop.companyName)
      }
    } else {
      // Account not yet verified or has pending requirements
      if (workshop.stripeEnabled) {
        await prisma.workshop.update({
          where: { id: workshop.id },
          data: { stripeEnabled: false }
        })
        console.log('⚠️  Stripe disabled for workshop:', workshop.companyName)
        console.log('   Reason: Account not fully verified or has pending requirements')
      } else {
        console.log('ℹ️  Workshop still pending verification:', workshop.companyName)
        if (hasRequirements) {
          console.log('   Pending requirements:', requirementsCurrentlyDue.join(', '))
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling account update:', error)
  }
}
