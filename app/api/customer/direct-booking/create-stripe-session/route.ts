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

    const { workshopId, date, time, serviceType, vehicleId, totalPrice, basePrice, balancingPrice, storagePrice, hasBalancing, hasStorage, workshopName, serviceName, vehicleInfo, paymentMethodType } = await request.json()

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

    // Map payment method types to Stripe payment_method_types
    const paymentMethodMap: Record<string, string[]> = {
      'card': ['card'],
      'customer_balance': ['customer_balance'], // Bank Transfer (Überweisung)
      'klarna': ['klarna'],
    }

    // Determine which payment methods to enable
    const enabledPaymentMethods = paymentMethodType && paymentMethodMap[paymentMethodType]
      ? paymentMethodMap[paymentMethodType]
      : ['card'] // Default to card if not specified

    // Create Stripe Checkout Session with Direct Charges to Workshop
    // Payment goes 100% to workshop (no platform fee)
    
    // For customer_balance, we need to create or retrieve a Stripe Customer
    let stripeCustomerId: string | undefined = undefined
    if (enabledPaymentMethods.includes('customer_balance')) {
      // Check if customer already has a Stripe Customer ID
      const customer = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true }
      })

      if (customer?.stripeCustomerId) {
        stripeCustomerId = customer.stripeCustomerId
      } else {
        // Create new Stripe Customer
        const stripeCustomer = await stripe.customers.create({
          email: session.user.email || undefined,
          name: session.user.name || undefined,
          metadata: {
            userId: session.user.id
          }
        })
        stripeCustomerId = stripeCustomer.id

        // Save Stripe Customer ID to database
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId }
        })
      }
    }
    
    // Build session configuration
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: enabledPaymentMethods,
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
      customer: stripeCustomerId, // Set customer for customer_balance
      customer_email: stripeCustomerId ? undefined : (session.user.email || undefined), // Only set if no customer
      
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/home/workshop/${workshopId}/payment/success?session_id={CHECKOUT_SESSION_ID}&service=${serviceType}&date=${date}&time=${time}&vehicleId=${vehicleId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/home/workshop/${workshopId}/payment?service=${serviceType}&date=${date}&time=${time}&vehicleId=${vehicleId}`,
      
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
    }

    // Special configuration for different payment methods with Stripe Connect
    // Note: Klarna and customer_balance (bank transfer) don't support on_behalf_of
    // They only work with transfer_data (direct charges)
    if (enabledPaymentMethods.includes('customer_balance')) {
      // Bank Transfer requires customer_balance configuration
      sessionConfig.payment_method_options = {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: {
            type: 'eu_bank_transfer', // For European bank transfers
          },
        },
      }
      // For bank transfer, only use transfer_data
      sessionConfig.payment_intent_data = {
        transfer_data: {
          destination: workshop.stripeAccountId,
        },
      }
    } else if (enabledPaymentMethods.includes('klarna')) {
      // Klarna only works with transfer_data (no on_behalf_of)
      // Note: Klarna also requires the connected account to have Klarna capabilities enabled
      sessionConfig.payment_intent_data = {
        transfer_data: {
          destination: workshop.stripeAccountId,
        },
      }
    } else {
      // For card payment methods, use both on_behalf_of and transfer_data
      sessionConfig.payment_intent_data = {
        on_behalf_of: workshop.stripeAccountId,
        transfer_data: {
          destination: workshop.stripeAccountId,
        },
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig)

    console.log('[STRIPE] Checkout session created:', checkoutSession.id)

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('[STRIPE] Error creating checkout session:', error)
    
    // Provide more helpful error messages
    if (error instanceof Stripe.errors.StripeError) {
      const errorMessage = error.message
      
      // Check for common Klarna errors
      if (errorMessage.includes('klarna') && errorMessage.includes('invalid')) {
        return NextResponse.json(
          { 
            error: 'Klarna ist für diese Werkstatt noch nicht verfügbar', 
            details: 'Die Werkstatt muss zuerst die Stripe-Verifizierung abschließen, um Klarna-Zahlungen zu akzeptieren.' 
          },
          { status: 400 }
        )
      }
      
      // Check for payment method capability errors
      if (errorMessage.includes('payment method') && errorMessage.includes('not supported')) {
        return NextResponse.json(
          { 
            error: 'Diese Zahlungsmethode ist nicht verfügbar', 
            details: 'Bitte wählen Sie eine andere Zahlungsmethode.' 
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create Stripe session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
