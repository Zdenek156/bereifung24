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

    const { 
      workshopId, date, time, serviceType, vehicleId, totalPrice, basePrice, balancingPrice, storagePrice, disposalFee, runFlatSurcharge,
      hasBalancing, hasStorage, hasDisposal,
      workshopName, serviceName, vehicleInfo, paymentMethodType, reservationId,
      // Tire data (for TIRE_CHANGE, TIRE_MOUNT services)
      tireBrand, tireModel, tireSize, tireLoadIndex, tireSpeedIndex, tireEAN, tireQuantity,
      tirePurchasePrice, totalTirePurchasePrice, tireRunFlat, tire3PMSF
    } = await request.json()

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

    if (!workshop) {
      console.error('[STRIPE] Workshop not found:', workshopId)
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    // In test mode, allow payments to go to platform account (for testing without Connect)
    const isTestMode = stripeMode === 'test'
    const useConnectAccount = workshop.stripeEnabled && workshop.stripeAccountId && !isTestMode

    console.log('[STRIPE] Creating session with mode:', stripeMode)
    if (useConnectAccount) {
      console.log('[STRIPE] Payment goes to workshop via Connect:', workshop.stripeAccountId)
    } else {
      console.log('[STRIPE] Payment goes to platform account (test mode or no Connect)')
    }

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
      'card': ['card', 'link'], // Card + Stripe Link (Apple Pay & Google Pay appear automatically)
      'customer_balance': ['customer_balance'], // Bank Transfer (Überweisung)
      'klarna': ['klarna'],
      'paypal': ['paypal'], // PayPal via Stripe
    }

    // Determine which payment methods to enable
    const enabledPaymentMethods = paymentMethodType && paymentMethodMap[paymentMethodType]
      ? paymentMethodMap[paymentMethodType]
      : ['card'] // Default to card if not specified

    // Create Stripe Checkout Session with Application Fee (6.9% commission)
    // Customer pays total → Platform takes 6.9% → Stripe fees deducted from platform fee → Workshop gets 93.1%
    // Example: 100€ → Platform: 6.9€ - Stripe fees → Workshop: 93.10€
    
    // Calculate application fee (6.9% commission for platform)
    const PLATFORM_COMMISSION_RATE = 0.069 // 6.9%
    const applicationFeeAmount = Math.round(totalPrice * 100 * PLATFORM_COMMISSION_RATE) // in cents
    
    console.log('[STRIPE] Payment breakdown:', {
      totalPrice: totalPrice,
      platformCommission: `${(totalPrice * PLATFORM_COMMISSION_RATE).toFixed(2)}€`,
      workshopReceives: `${(totalPrice * (1 - PLATFORM_COMMISSION_RATE)).toFixed(2)}€`,
      note: 'Stripe fees will be deducted from platform commission'
    })
    
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
      
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workshop/${workshopId}/payment/success?session_id={CHECKOUT_SESSION_ID}&service=${serviceType}&date=${date}&time=${time}&vehicleId=${vehicleId}${reservationId ? `&reservationId=${reservationId}` : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/workshop/${workshopId}/payment?service=${serviceType}&date=${date}&time=${time}&vehicleId=${vehicleId}`,
      
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
        disposalFee: disposalFee?.toString() || '0',
        runFlatSurcharge: runFlatSurcharge?.toString() || '0',
        totalPrice: totalPrice.toString(),
        hasBalancing: hasBalancing?.toString() || 'false',
        hasStorage: hasStorage?.toString() || 'false',
        hasDisposal: hasDisposal?.toString() || 'false',
        // Tire data
        tireBrand: tireBrand || '',
        tireModel: tireModel || '',
        tireSize: tireSize || '',
        tireLoadIndex: tireLoadIndex || '',
        tireSpeedIndex: tireSpeedIndex || '',
        tireEAN: tireEAN || '',
        tireQuantity: tireQuantity?.toString() || '0',
        tirePurchasePrice: tirePurchasePrice?.toString() || '0',
        totalTirePurchasePrice: totalTirePurchasePrice?.toString() || '0',
        tireRunFlat: tireRunFlat?.toString() || 'false',
        tire3PMSF: tire3PMSF?.toString() || 'false',
      },
    }

    // Special configuration for different payment methods with Stripe Connect
    // Using application_fee_amount to take 6.9% commission
    // Note: Different payment methods have different requirements
    // Only use Connect features if workshop has valid Connect account (not in test mode)
    if (useConnectAccount) {
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
        // For bank transfer with application fee
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: workshop.stripeAccountId!,
          },
        }
      } else if (enabledPaymentMethods.includes('klarna')) {
        // Klarna with application fee
        // Note: Klarna requires the connected account to have Klarna capabilities enabled
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: workshop.stripeAccountId!,
          },
        }
      } else if (enabledPaymentMethods.includes('paypal')) {
        // PayPal via Stripe with application fee
        // Note: PayPal requires additional configuration in Stripe Dashboard
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: workshop.stripeAccountId!,
          },
        }
      } else {
        // For card payment methods with application fee
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          on_behalf_of: workshop.stripeAccountId!,
          transfer_data: {
            destination: workshop.stripeAccountId!,
          },
        }
      }
    } else {
      // TEST MODE: No Connect account splitting - payment goes directly to platform
      // This allows testing without setting up Stripe Connect
      console.log('[STRIPE] Test mode: Skipping Connect account splitting')
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
