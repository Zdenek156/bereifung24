import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'
import { notifyBookingUpdate } from '@/lib/pushNotificationService'

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
 * - charge.updated  (for stripeFee backfill)
 * - charge.refunded
 * - account.updated (for Stripe Connect)
 * - charge.dispute.created (Chargeback)
 * - charge.dispute.updated
 * - charge.dispute.closed
 * - charge.dispute.funds_withdrawn
 * - charge.dispute.funds_reinstated
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
    // Optional second secret for the Snapshot-style endpoint (dispute events)
    const webhookSecretDisputes = await getApiSetting('STRIPE_WEBHOOK_SECRET_DISPUTES', 'STRIPE_WEBHOOK_SECRET_DISPUTES')

    if (!stripeSecretKey || !webhookSecret) {
      console.error('❌ Stripe keys not configured')
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    // Verify webhook signature - try primary secret first, then dispute secret as fallback
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      if (webhookSecretDisputes) {
        try {
          event = stripe.webhooks.constructEvent(body, signature, webhookSecretDisputes)
        } catch (err2) {
          console.error('❌ Webhook signature verification failed (both secrets):', err2)
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } else {
        console.error('❌ Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
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

      case 'charge.updated':
        await handleChargeUpdated(event.data.object as Stripe.Charge, stripe)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed':
        await handleDisputeEvent(event.data.object as Stripe.Dispute, event.type)
        break

      case 'charge.dispute.funds_withdrawn':
        await handleDisputeFundsWithdrawn(event.data.object as Stripe.Dispute)
        break

      case 'charge.dispute.funds_reinstated':
        await handleDisputeFundsReinstated(event.data.object as Stripe.Dispute)
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

    // Track created/updated booking ID for post-processing (emails, commissions)
    let resolvedBookingId: string | undefined

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
      
      // Calculate commission breakdown (6.9% platform commission)
      const PLATFORM_COMMISSION_RATE = 0.069
      const totalPriceNum = totalPrice
      // When WORKSHOP bears coupon cost, calculate commission on original price
      const couponCostBearer = session.metadata?.costBearer || 'PLATFORM'
      const originalPriceNum = session.metadata?.originalPrice ? parseFloat(session.metadata.originalPrice) : null
      const commissionBase = (couponCostBearer === 'WORKSHOP' && originalPriceNum) ? originalPriceNum : totalPriceNum
      const platformCommission = commissionBase * PLATFORM_COMMISSION_RATE
      const workshopPayout = totalPriceNum - platformCommission
      const platformCommissionCents = Math.round(platformCommission * 100)
      
      // Estimate Stripe fees (1.5% + 0.25€ for EU cards)
      const stripeFeesEstimate = (totalPriceNum * 0.015) + 0.25
      const platformNetCommission = platformCommission - stripeFeesEstimate
      
      console.log('💰 Payment breakdown:', {
        total: `${totalPriceNum.toFixed(2)}€`,
        commissionBase: `${commissionBase.toFixed(2)}€`,
        costBearer: couponCostBearer,
        platformCommission: `${platformCommission.toFixed(2)}€`,
        workshopPayout: `${workshopPayout.toFixed(2)}€`,
        stripeFeesEstimate: `${stripeFeesEstimate.toFixed(2)}€`,
        platformNetCommission: `${platformNetCommission.toFixed(2)}€`
      })
      
      // Get actual Stripe fees from Balance Transaction
      let stripeFee: number | null = null
      let paymentMethodDetail: string | null = null
      
      try {
        const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')
        if (stripeSecretKey && session.payment_intent) {
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })
          const paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id
          
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['latest_charge']
          })
          
          const charge = paymentIntent.latest_charge as Stripe.Charge | null
          
          if (charge) {
            // Get payment method detail
            paymentMethodDetail = charge.payment_method_details?.type || null
            
            if (charge.balance_transaction) {
              const balanceTransactionId = typeof charge.balance_transaction === 'string' 
                ? charge.balance_transaction 
                : charge.balance_transaction.id
              
              const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)
              stripeFee = balanceTransaction.fee / 100
              
              console.log('💰 Actual Stripe fee:', {
                feeInCents: balanceTransaction.fee,
                feeInEuros: stripeFee,
                paymentMethodDetail
              })
            }
          }
        }
      } catch (feeError) {
        console.error('⚠️ Error retrieving Stripe fee:', feeError)
      }
      
      await prisma.directBooking.update({
        where: { id: existingBooking.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'STRIPE',
          stripePaymentId: session.payment_intent as string,
          paymentMethodDetail,
          ...(stripeFee !== null && { stripeFee }),
          paidAt: new Date(),
          status: 'CONFIRMED',
          platformCommission,
          platformCommissionCents,
          workshopPayout,
          stripeFeesEstimate,
          platformNetCommission,
          // Tire data
          tireBrand: session.metadata?.tireBrand || null,
          tireModel: session.metadata?.tireModel || null,
          tireSize: session.metadata?.tireSize || null,
          tireLoadIndex: session.metadata?.tireLoadIndex || null,
          tireSpeedIndex: session.metadata?.tireSpeedIndex || null,
          tireEAN: session.metadata?.tireEAN || null,
          tireQuantity: session.metadata?.tireQuantity ? parseInt(session.metadata.tireQuantity) : null,
          tirePurchasePrice: session.metadata?.tirePurchasePrice ? parseFloat(session.metadata.tirePurchasePrice) : null,
          totalTirePurchasePrice: session.metadata?.totalTirePurchasePrice ? parseFloat(session.metadata.totalTirePurchasePrice) : null,
          tireRunFlat: session.metadata?.tireRunFlat === 'true',
          tire3PMSF: session.metadata?.tire3PMSF === 'true',
          // Additional pricing
          disposalFee: session.metadata?.disposalFee ? parseFloat(session.metadata.disposalFee) : null,
          runFlatSurcharge: session.metadata?.runFlatSurcharge ? parseFloat(session.metadata.runFlatSurcharge) : null,
          hasDisposal: session.metadata?.hasDisposal === 'true',
          // Coupon data
          couponId: session.metadata?.couponId || null,
          couponCode: session.metadata?.couponCode || null,
          discountAmount: session.metadata?.discountAmount ? parseFloat(session.metadata.discountAmount) : null,
          originalPrice: session.metadata?.originalPrice ? parseFloat(session.metadata.originalPrice) : null,
          couponCostBearer: session.metadata?.costBearer || null,
        }
      })
      console.log('✅ DirectBooking updated:', existingBooking.id)
      resolvedBookingId = existingBooking.id
    } else {
      // 🛡️ Double booking prevention: check if slot is already taken
      const conflictingBooking = await prisma.directBooking.findFirst({
        where: {
          workshopId,
          date: new Date(date),
          time,
          status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING'] },
        }
      })

      if (conflictingBooking) {
        console.error(`🚨 [STRIPE WEBHOOK] DOUBLE BOOKING PREVENTED: Workshop ${workshopId} at ${date} ${time} — already booked by ${conflictingBooking.id}`)
        // Initiate refund for the duplicate payment
        try {
          const paymentIntentId = session.payment_intent as string
          if (paymentIntentId) {
            const stripe = (await import('stripe')).default
            const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!)
            await stripeClient.refunds.create({ payment_intent: paymentIntentId })
            console.log(`💸 [STRIPE WEBHOOK] Refund initiated for duplicate booking payment: ${paymentIntentId}`)
          }
        } catch (refundError) {
          console.error('❌ [STRIPE WEBHOOK] Refund failed for duplicate booking:', refundError)
        }

        // Send notification email to customer about the conflict
        try {
          const { sendTemplateEmail } = await import('@/lib/email')
          const customerUser = await prisma.user.findFirst({ where: { customer: { id: customerId } } })
          if (customerUser?.email) {
            await sendTemplateEmail(
              'booking-conflict',
              customerUser.email,
              { date, time },
              undefined,
              {
                subject: 'Terminkonflikt - Erstattung wird veranlasst',
                html: `<p>Leider wurde Ihr gewünschter Termin am ${date} um ${time} Uhr bereits von einem anderen Kunden gebucht.</p><p>Ihre Zahlung wird automatisch erstattet. Bitte buchen Sie einen neuen Termin.</p><p>Wir entschuldigen uns für die Unannehmlichkeiten.</p>`
              }
            )
          }
        } catch (emailError) {
          console.error('❌ [STRIPE WEBHOOK] Conflict email failed:', emailError)
        }

        return NextResponse.json({ received: true, status: 'conflict_prevented' })
      }

      // Calculate commission breakdown (6.9% platform commission)
      const PLATFORM_COMMISSION_RATE = 0.069
      const totalPriceNum = totalPrice
      // When WORKSHOP bears coupon cost, calculate commission on original price
      const couponCostBearer = session.metadata?.costBearer || 'PLATFORM'
      const originalPriceNum = session.metadata?.originalPrice ? parseFloat(session.metadata.originalPrice) : null
      const commissionBase = (couponCostBearer === 'WORKSHOP' && originalPriceNum) ? originalPriceNum : totalPriceNum
      const platformCommission = commissionBase * PLATFORM_COMMISSION_RATE
      const workshopPayout = totalPriceNum - platformCommission
      const platformCommissionCents = Math.round(platformCommission * 100)
      
      // Estimate Stripe fees (1.5% + 0.25€ for EU cards)
      const stripeFeesEstimate = (totalPriceNum * 0.015) + 0.25
      const platformNetCommission = platformCommission - stripeFeesEstimate
      
      console.log('💰 Payment breakdown:', {
        total: `${totalPriceNum.toFixed(2)}€`,
        commissionBase: `${commissionBase.toFixed(2)}€`,
        costBearer: couponCostBearer,
        platformCommission: `${platformCommission.toFixed(2)}€`,
        workshopPayout: `${workshopPayout.toFixed(2)}€`,
        stripeFeesEstimate: `${stripeFeesEstimate.toFixed(2)}€`,
        platformNetCommission: `${platformNetCommission.toFixed(2)}€`
      })
      
      // Get actual Stripe fees from Balance Transaction
      let stripeFee: number | null = null
      let paymentMethodDetail: string | null = null
      
      try {
        const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')
        if (stripeSecretKey && session.payment_intent) {
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })
          const paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id
          
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['latest_charge']
          })
          
          const charge = paymentIntent.latest_charge as Stripe.Charge | null
          
          if (charge) {
            // Get payment method detail
            paymentMethodDetail = charge.payment_method_details?.type || null
            
            if (charge.balance_transaction) {
              const balanceTransactionId = typeof charge.balance_transaction === 'string' 
                ? charge.balance_transaction 
                : charge.balance_transaction.id
              
              const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)
              stripeFee = balanceTransaction.fee / 100
              
              console.log('💰 Actual Stripe fee:', {
                feeInCents: balanceTransaction.fee,
                feeInEuros: stripeFee,
                paymentMethodDetail
              })
            }
          }
        }
      } catch (feeError) {
        console.error('⚠️ Error retrieving Stripe fee:', feeError)
      }
      
      // Auto-detect stored tires for WHEEL_CHANGE (or TIRE_CHANGE with tire purchase)
      // Skip for TIRE_CHANGE "Nur Montage" (no tire purchase) — customer brings own tires
      let fromStorageBookingId: string | null = null
      const sType = serviceType || ''
      const hasWebhookTirePurchase = !!(session.metadata?.tireBrand || session.metadata?.tireBrandFront)
      const shouldCheckStorage = sType === 'WHEEL_CHANGE' || (sType === 'TIRE_CHANGE' && hasWebhookTirePurchase)
      if (shouldCheckStorage) {
        try {
          const storageBooking = await prisma.directBooking.findFirst({
            where: {
              customerId,
              workshopId,
              ...(vehicleId ? { vehicleId } : {}), // Only match same vehicle
              hasStorage: true,
              status: { in: ['COMPLETED', 'CONFIRMED'] }
            },
            orderBy: { date: 'desc' },
            select: { id: true }
          })
          if (storageBooking) {
            fromStorageBookingId = storageBooking.id
            console.log('📦 [STRIPE WEBHOOK] Auto-detected stored tires for same vehicle:', fromStorageBookingId)
          }
        } catch (err) {
          console.error('[STRIPE WEBHOOK] Error checking stored tires:', err)
        }
      }

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
          washingPrice: session.metadata?.washingPrice ? parseFloat(session.metadata.washingPrice) : null,
          disposalFee: session.metadata?.disposalFee ? parseFloat(session.metadata.disposalFee) : null,
          runFlatSurcharge: session.metadata?.runFlatSurcharge ? parseFloat(session.metadata.runFlatSurcharge) : null,
          totalPrice,
          hasBalancing: session.metadata?.hasBalancing === 'true',
          hasStorage: session.metadata?.hasStorage === 'true',
          hasWashing: session.metadata?.hasWashing === 'true',
          hasDisposal: session.metadata?.hasDisposal === 'true',
          // Tire data
          tireBrand: session.metadata?.tireBrand || null,
          tireModel: session.metadata?.tireModel || null,
          tireSize: session.metadata?.tireSize || null,
          tireLoadIndex: session.metadata?.tireLoadIndex || null,
          tireSpeedIndex: session.metadata?.tireSpeedIndex || null,
          tireEAN: session.metadata?.tireEAN || null,
          tireQuantity: session.metadata?.tireQuantity ? parseInt(session.metadata.tireQuantity) : null,
          tirePurchasePrice: session.metadata?.tirePurchasePrice ? parseFloat(session.metadata.tirePurchasePrice) : null,
          totalTirePurchasePrice: session.metadata?.totalTirePurchasePrice ? parseFloat(session.metadata.totalTirePurchasePrice) : null,
          tireRunFlat: session.metadata?.tireRunFlat === 'true',
          tire3PMSF: session.metadata?.tire3PMSF === 'true',
          durationMinutes: session.metadata?.durationMinutes ? parseInt(session.metadata.durationMinutes) : 60,
          status: 'CONFIRMED',
          paymentMethod: 'STRIPE',
          paymentStatus: 'PAID',
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          paymentMethodDetail,
          ...(stripeFee !== null && { stripeFee }),
          paidAt: new Date(),
          platformCommission,
          platformCommissionCents,
          workshopPayout,
          stripeFeesEstimate,
          platformNetCommission,
          fromStorageBookingId,
          // Coupon data
          couponId: session.metadata?.couponId || null,
          couponCode: session.metadata?.couponCode || null,
          discountAmount: session.metadata?.discountAmount ? parseFloat(session.metadata.discountAmount) : null,
          originalPrice: session.metadata?.originalPrice ? parseFloat(session.metadata.originalPrice) : null,
          couponCostBearer: session.metadata?.costBearer || null,
        }
      })

      console.log('✅ DirectBooking created:', booking.id)
      resolvedBookingId = booking.id
    }

    // Load complete booking data with relations for email
    const bookingId = resolvedBookingId
    if (!bookingId) {
      console.error('❌ No booking ID found after create/update')
      return
    }

    // Redeem coupon if one was used
    if (session.metadata?.couponId) {
      try {
        const couponId = session.metadata.couponId
        const originalAmount = session.metadata.originalPrice ? parseFloat(session.metadata.originalPrice) : totalPrice
        const couponDiscountAmount = session.metadata.discountAmount ? parseFloat(session.metadata.discountAmount) : 0

        await prisma.$transaction(async (tx) => {
          await tx.couponUsage.create({
            data: {
              couponId,
              customerId,
              bookingId,
              originalAmount,
              discountAmount: couponDiscountAmount,
              finalAmount: totalPrice,
            }
          })
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } }
          })
        })
        console.log('🎫 Coupon redeemed:', session.metadata.couponCode, '| Discount:', couponDiscountAmount.toFixed(2), '€')
      } catch (couponError) {
        console.error('⚠️ Error redeeming coupon:', couponError)
      }
    }

    const completeBooking = await prisma.directBooking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        workshop: {
          include: {
            user: true
          }
        },
        vehicle: true
      }
    })

    if (!completeBooking) {
      console.error('❌ Could not load complete booking data')
      return
    }

    // Load workshop supplier info (if applicable)
    const workshopSupplier = await prisma.workshopSupplier.findFirst({
      where: { workshopId: completeBooking.workshopId }
    })

    // Look up storage info if booking references stored tires
    const webhookFromStorageId = (completeBooking as any).fromStorageBookingId || null
    let webhookStorageLocation: string | null = null
    if (webhookFromStorageId) {
      try {
        const storageBooking = await prisma.directBooking.findUnique({
          where: { id: webhookFromStorageId },
          select: { storageLocation: true }
        })
        webhookStorageLocation = (storageBooking as any)?.storageLocation || null
        console.log('📦 Storage info for webhook booking:', { webhookFromStorageId, webhookStorageLocation })
      } catch (e) {
        console.error('Failed to look up storage booking in webhook:', e)
      }
    }

    // Format date
    const { format } = await import('date-fns')
    const { de } = await import('date-fns/locale')
    const appointmentDateFormatted = format(completeBooking.date, 'dd.MM.yyyy', { locale: de })

    // Service labels
    const serviceLabels: Record<string, string> = {
      'WHEEL_CHANGE': 'Räderwechsel',
      'TIRE_CHANGE': 'Reifenwechsel',
      'TIRE_MOUNT': 'Reifenmontage',
      'TIRE_REPAIR': 'Reifenreparatur',
      'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
      'ALIGNMENT_BOTH': 'Achsvermessung',
      'CLIMATE_SERVICE': 'Klimaservice'
    }
    const packageLabels: Record<string, string> = {
      'foreign_object': 'Fremdkörper-Reparatur',
      'valve_damage': 'Ventilschaden-Reparatur',
      'measurement_both': 'Vermessung — Beide Achsen',
      'measurement_front': 'Vermessung — Vorderachse',
      'measurement_rear': 'Vermessung — Hinterachse',
      'adjustment_both': 'Einstellung — Beide Achsen',
      'adjustment_front': 'Einstellung — Vorderachse',
      'adjustment_rear': 'Einstellung — Hinterachse',
      'full_service': 'Komplett mit Inspektion',
      'check': 'Klima Basis-Check',
      'basic': 'Klima Standard-Service',
      'comfort': 'Klima Komfort-Service',
      'premium': 'Klima Premium-Service',
    }
    const baseServiceName = serviceLabels[completeBooking.serviceType] || completeBooking.serviceType
    const subtypeLabel = completeBooking.serviceSubtype ? packageLabels[completeBooking.serviceSubtype] : null
    const serviceName = subtypeLabel
      ? `${baseServiceName} - ${subtypeLabel}`
      : baseServiceName

    // Generate ICS file for customer
    const { generateICSFile, getServiceLabel } = await import('@/lib/calendar')
    const icsContent = generateICSFile({
      bookingId: completeBooking.id,
      serviceName: serviceName,
      workshopName: completeBooking.workshop.companyName || completeBooking.workshop.user.name || 'Werkstatt',
      workshopAddress: `${completeBooking.workshop.user.street}, ${completeBooking.workshop.user.zipCode} ${completeBooking.workshop.user.city}`,
      workshopPhone: completeBooking.workshop.user.phone || '',
      workshopEmail: completeBooking.workshop.user.email,
      date: completeBooking.date,
      time: completeBooking.time,
      durationMinutes: completeBooking.durationMinutes,
      customerName: completeBooking.customer.user.name || 'Kunde',
      customerEmail: completeBooking.customer.user.email,
      customerPhone: completeBooking.customer.user.phone,
    })

    // Create Google Calendar event for workshop
    try {
      const { createCalendarEvent, refreshAccessToken } = await import('@/lib/google-calendar')
      const { createBerlinDate } = await import('@/lib/timezone-utils')

      // Determine calendar credentials: workshop first, then fallback to employee
      let calAccessToken: string | null = null
      let calRefreshToken: string | null = null
      let calCalendarId: string | null = null
      let calSource = ''

      if (completeBooking.workshop.googleAccessToken && completeBooking.workshop.googleRefreshToken && completeBooking.workshop.googleCalendarId) {
        calAccessToken = completeBooking.workshop.googleAccessToken
        calRefreshToken = completeBooking.workshop.googleRefreshToken
        calCalendarId = completeBooking.workshop.googleCalendarId
        calSource = 'workshop'
        console.log('[STRIPE WEBHOOK] Using WORKSHOP Google Calendar')
      } else {
        // Fallback: find first employee with connected Google Calendar
        const empWithCal = await prisma.employee.findFirst({
          where: {
            workshopId: completeBooking.workshopId,
            googleCalendarId: { not: null },
            googleAccessToken: { not: null },
            googleRefreshToken: { not: null },
          },
          select: { id: true, name: true, googleCalendarId: true, googleAccessToken: true, googleRefreshToken: true }
        })
        if (empWithCal) {
          calAccessToken = empWithCal.googleAccessToken
          calRefreshToken = empWithCal.googleRefreshToken
          calCalendarId = empWithCal.googleCalendarId
          calSource = `employee:${empWithCal.name}`
          console.log(`[STRIPE WEBHOOK] Using EMPLOYEE Google Calendar: ${empWithCal.name}`)
        }
      }

      if (calAccessToken && calRefreshToken && calCalendarId) {
        let accessToken = calAccessToken
        try {
          const newTokens = await refreshAccessToken(calRefreshToken)
          if (newTokens.access_token) {
            accessToken = newTokens.access_token
          }
        } catch (refreshErr) {
          console.warn('[STRIPE WEBHOOK] Token refresh failed, trying with existing token:', refreshErr instanceof Error ? refreshErr.message : refreshErr)
        }
        
        const calBookingDate = completeBooking.date
        const [calH, calM] = completeBooking.time.split(':').map(Number)
        const calStart = createBerlinDate(calBookingDate.getUTCFullYear(), calBookingDate.getUTCMonth() + 1, calBookingDate.getUTCDate(), calH, calM)
        const calEnd = new Date(calStart.getTime() + completeBooking.durationMinutes * 60000)
        
        const vehicleStr = completeBooking.vehicle
          ? `${completeBooking.vehicle.brand} ${completeBooking.vehicle.model}${completeBooking.vehicle.licensePlate ? ` - ${completeBooking.vehicle.licensePlate}` : ''}`
          : 'Nicht angegeben'
        
        const calDesc = [
          completeBooking.customer.user.name || 'Kunde',
          completeBooking.customer.user.email,
          `Telefon: ${completeBooking.customer.user.phone || 'Nicht angegeben'}`,
          '',
          `Fahrzeug: ${vehicleStr}`,
          `Service: ${serviceName}`,
        ]
        if (completeBooking.hasBalancing) calDesc.push('✅ Auswuchtung')
        if (completeBooking.hasStorage) calDesc.push('✅ Einlagerung')
        if (completeBooking.hasWashing) calDesc.push('✅ Räder waschen')
        if (completeBooking.hasDisposal) calDesc.push('✅ Entsorgung')
        // Tire info
        const td = completeBooking.tireData as any
        if (td?.isMixedTires) {
          calDesc.push('', '🛞 Reifen (Mischbereifung):')
          if (td.front) calDesc.push(`VA: ${td.front.quantity || 2}× ${td.front.brand} ${td.front.model}${td.front.size ? ` (${td.front.size})` : ''}`)
          if (td.rear) calDesc.push(`HA: ${td.rear.quantity || 2}× ${td.rear.brand} ${td.rear.model}${td.rear.size ? ` (${td.rear.size})` : ''}`)
        } else if (completeBooking.tireBrand) {
          calDesc.push('', `🛞 Reifen: ${completeBooking.tireQuantity || 4}× ${completeBooking.tireBrand} ${completeBooking.tireModel || ''}`)
          if (completeBooking.tireSize) calDesc.push(`   Größe: ${completeBooking.tireSize} ${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`.trim())
        }
        calDesc.push('')
        // Für Nur Montage: Kombinierte Montage-Zeile
        if (completeBooking.serviceType === 'TIRE_CHANGE' && !completeBooking.totalTirePurchasePrice && completeBooking.basePrice) {
          calDesc.push(`Montage: ${Number(completeBooking.basePrice).toFixed(2)} €`)
        }
        if (completeBooking.disposalFee && Number(completeBooking.disposalFee) > 0) {
          calDesc.push(`Entsorgung: ${Number(completeBooking.disposalFee).toFixed(2)} €`)
        }
        if (completeBooking.runFlatSurcharge && Number(completeBooking.runFlatSurcharge) > 0) {
          calDesc.push(`RunFlat-Zuschlag: ${Number(completeBooking.runFlatSurcharge).toFixed(2)} €`)
        }
        calDesc.push(`Gesamtpreis: ${Number(completeBooking.totalPrice).toFixed(2)} €`)
        
        const calSummaryTire = td?.isMixedTires
          ? ` - ${td.front?.brand || ''} / ${td.rear?.brand || ''}`
          : completeBooking.tireBrand ? ` - ${completeBooking.tireBrand}` : ''
        
        await createCalendarEvent(
          accessToken,
          calRefreshToken,
          calCalendarId,
          {
            summary: `${serviceName} - ${vehicleStr}${calSummaryTire}`,
            description: calDesc.join('\n'),
            start: calStart.toISOString(),
            end: calEnd.toISOString(),
            attendees: [{ email: completeBooking.customer.user.email }]
          }
        )
        console.log(`✅ Google Calendar event created from Stripe webhook (${calSource})`)
      } else {
        console.log('[STRIPE WEBHOOK] ⏭️ No Google Calendar connected (workshop or employee)')
      }
    } catch (calError) {
      console.error('❌ Error creating calendar event from Stripe webhook:', calError)
    }

    // Send customer confirmation email
    try {
      const { sendTemplateEmail, directBookingConfirmationCustomerEmail } = await import('@/lib/email')
      
      const customerEmailData = directBookingConfirmationCustomerEmail({
        customerName: completeBooking.customer.user.name || 'Kunde',
        workshopName: completeBooking.workshop.companyName || completeBooking.workshop.user.name || 'Werkstatt',
        workshopAddress: `${completeBooking.workshop.user.street}, ${completeBooking.workshop.user.zipCode} ${completeBooking.workshop.user.city}`,
        workshopPhone: completeBooking.workshop.user.phone || '',
        workshopEmail: completeBooking.workshop.user.email,
        workshopLogoUrl: completeBooking.workshop.logoUrl || undefined,
        serviceType: completeBooking.serviceType,
        serviceName: serviceName,
        appointmentDate: appointmentDateFormatted,
        appointmentTime: completeBooking.time,
        durationMinutes: completeBooking.durationMinutes,
        bookingId: completeBooking.id,
        vehicleBrand: completeBooking.vehicle?.brand,
        vehicleModel: completeBooking.vehicle?.model,
        vehicleLicensePlate: completeBooking.vehicle?.licensePlate,
        // Tire details
        tireBrand: completeBooking.tireBrand || undefined,
        tireModel: completeBooking.tireModel || undefined,
        tireSize: completeBooking.tireSize 
          ? `${completeBooking.tireSize} ${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`.trim() 
          : undefined,
        tireQuantity: completeBooking.tireQuantity || undefined,
        tireRunFlat: completeBooking.tireRunFlat,
        tire3PMSF: completeBooking.tire3PMSF,
        tireEAN: completeBooking.tireEAN || undefined,
        tireData: completeBooking.tireData || undefined,
        totalTirePurchasePrice: completeBooking.totalTirePurchasePrice ? Number(completeBooking.totalTirePurchasePrice) : undefined,
        // Pricing
        basePrice: Number(completeBooking.basePrice),
        balancingPrice: completeBooking.balancingPrice ? Number(completeBooking.balancingPrice) : undefined,
        storagePrice: completeBooking.storagePrice ? Number(completeBooking.storagePrice) : undefined,
        washingPrice: completeBooking.washingPrice ? Number(completeBooking.washingPrice) : undefined,
        disposalFee: completeBooking.disposalFee ? Number(completeBooking.disposalFee) : undefined,
        runFlatSurcharge: completeBooking.runFlatSurcharge ? Number(completeBooking.runFlatSurcharge) : undefined,
        totalPrice: Number(completeBooking.totalPrice),
        paymentMethod: 'Stripe',
        hasBalancing: completeBooking.hasBalancing,
        hasStorage: completeBooking.hasStorage,
        hasWashing: completeBooking.hasWashing,
        hasDisposal: completeBooking.hasDisposal,
        // Coupon data
        couponCode: completeBooking.couponCode || undefined,
        discountAmount: completeBooking.discountAmount ? Number(completeBooking.discountAmount) : undefined,
        originalPrice: completeBooking.originalPrice ? Number(completeBooking.originalPrice) : undefined,
      })

      const attachments = icsContent ? [{
        filename: 'termin.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }] : []

      await sendTemplateEmail(
        'BOOKING_CONFIRMATION_CUSTOMER_PAID',
        completeBooking.customer.user.email,
        {},
        attachments,
        customerEmailData
      )

      console.log('✅ Customer confirmation email sent')
    } catch (error) {
      console.error('❌ Error sending customer email:', error)
    }

    // Send workshop notification email (if enabled)
    if (completeBooking.workshop.emailNotifyBookings) {
      try {
        const { sendTemplateEmail, directBookingNotificationWorkshopEmail } = await import('@/lib/email')
      
      const workshopEmailData = directBookingNotificationWorkshopEmail({
        workshopName: completeBooking.workshop.companyName || completeBooking.workshop.user.name || 'Werkstatt',
        bookingId: completeBooking.id,
        serviceName: serviceName,
        serviceType: completeBooking.serviceType,
        appointmentDate: appointmentDateFormatted,
        appointmentTime: completeBooking.time,
        durationMinutes: completeBooking.durationMinutes,
        customerName: completeBooking.customer.user.name || 'Kunde',
        customerEmail: completeBooking.customer.user.email,
        customerPhone: completeBooking.customer.user.phone || '',
        customerAddress: completeBooking.customer.user.street 
          ? `${completeBooking.customer.user.street}, ${completeBooking.customer.user.zipCode} ${completeBooking.customer.user.city}`
          : undefined,
        vehicleBrand: completeBooking.vehicle?.brand,
        vehicleModel: completeBooking.vehicle?.model,
        vehicleLicensePlate: completeBooking.vehicle?.licensePlate,
        // Tire details
        tireBrand: completeBooking.tireBrand || undefined,
        tireModel: completeBooking.tireModel || undefined,
        tireSize: completeBooking.tireSize 
          ? `${completeBooking.tireSize} ${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`.trim()
          : undefined,
        tireQuantity: completeBooking.tireQuantity || undefined,
        tireEAN: completeBooking.tireEAN || undefined,
        tireRunFlat: completeBooking.tireRunFlat,
        tire3PMSF: completeBooking.tire3PMSF,
        tireArticleId: completeBooking.tireArticleId || undefined,
        tireData: completeBooking.tireData || undefined,
        tirePurchasePrice: completeBooking.tirePurchasePrice ? Number(completeBooking.tirePurchasePrice) : undefined,
        totalPurchasePrice: completeBooking.totalTirePurchasePrice ? Number(completeBooking.totalTirePurchasePrice) : undefined,
        // Supplier
        supplierName: workshopSupplier?.name,
        supplierConnectionType: workshopSupplier?.connectionType as 'API' | 'CSV' | undefined,
        supplierPhone: workshopSupplier?.phone || undefined,
        supplierEmail: workshopSupplier?.email || undefined,
        supplierWebsite: workshopSupplier?.website || undefined,
        // Pricing
        basePrice: Number(completeBooking.basePrice),
        balancingPrice: completeBooking.balancingPrice ? Number(completeBooking.balancingPrice) : undefined,
        storagePrice: completeBooking.storagePrice ? Number(completeBooking.storagePrice) : undefined,
        washingPrice: completeBooking.washingPrice ? Number(completeBooking.washingPrice) : undefined,
        disposalFee: completeBooking.disposalFee ? Number(completeBooking.disposalFee) : undefined,
        runFlatSurcharge: completeBooking.runFlatSurcharge ? Number(completeBooking.runFlatSurcharge) : undefined,
        totalPrice: Number(completeBooking.totalPrice),
        platformCommission: Number(completeBooking.platformCommission),
        workshopPayout: Number(completeBooking.workshopPayout),
        workshopProfit: completeBooking.totalTirePurchasePrice 
          ? Number(completeBooking.workshopPayout) - Number(completeBooking.totalTirePurchasePrice)
          : undefined,
        hasBalancing: completeBooking.hasBalancing,
        hasStorage: completeBooking.hasStorage,
        hasWashing: completeBooking.hasWashing,
        hasDisposal: (completeBooking.hasDisposal && (completeBooking.serviceType === 'TIRE_CHANGE' || completeBooking.serviceType === 'MOTORCYCLE_TIRE')) || undefined,
        fromStorageBookingId: webhookFromStorageId || undefined,
        storageLocationFromStorage: webhookStorageLocation || undefined,
        // Coupon data for workshop
        couponCode: completeBooking.couponCode || undefined,
        discountAmount: completeBooking.discountAmount ? Number(completeBooking.discountAmount) : undefined,
        originalPrice: completeBooking.originalPrice ? Number(completeBooking.originalPrice) : undefined,
        couponCostBearer: (completeBooking as any).couponCostBearer || undefined,
      })

      await sendTemplateEmail(
        'BOOKING_NOTIFICATION_WORKSHOP_PAID',
        completeBooking.workshop.user.email,
        {},
        undefined,
        workshopEmailData
      )

      console.log('✅ Workshop notification email sent')
    } catch (error) {
      console.error('❌ Error sending workshop email:', error)
    }
    } else {
      console.log(`⏭️  Workshop ${completeBooking.workshopId} has disabled booking notifications`)
    }

    // Create freelancer commission if workshop belongs to a freelancer
    try {
      const { createFreelancerCommission } = await import('@/lib/freelancer/commissionService')
      const commissionResult = await createFreelancerCommission(bookingId)
      if (commissionResult.created) {
        console.log(`💰 Freelancer commission created: ${commissionResult.freelancerAmount}€`)
      } else if (commissionResult.error) {
        console.log(`ℹ️ No freelancer commission: ${commissionResult.error}`)
      }
    } catch (commissionError) {
      console.error('⚠️ Error creating freelancer commission:', commissionError)
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

    // Get actual Stripe fees from Balance Transaction
    let stripeFee: number | null = null
    
    try {
      // Get Stripe keys from database
      const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')
      if (!stripeSecretKey) {
        console.error('❌ No Stripe secret key found')
      } else {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })
        
        // Retrieve the full PaymentIntent with charges
        const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
          expand: ['latest_charge']
        })
        
        const charge = fullPaymentIntent.latest_charge as Stripe.Charge | null
        
        if (charge && charge.balance_transaction) {
          // Retrieve the balance transaction to get actual fees
          const balanceTransactionId = typeof charge.balance_transaction === 'string' 
            ? charge.balance_transaction 
            : charge.balance_transaction.id
          
          const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)
          
          // Fee is in cents, convert to euros
          stripeFee = balanceTransaction.fee / 100
          
          console.log('💰 Actual Stripe fee:', {
            feeInCents: balanceTransaction.fee,
            feeInEuros: stripeFee,
            paymentMethodDetail: charge.payment_method_details?.type
          })
        }
      }
    } catch (feeError) {
      console.error('⚠️ Error retrieving Stripe fee:', feeError)
      // Continue without fee - we'll estimate it later if needed
    }

    // Update payment record with actual fee
    await prisma.directBooking.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        ...(stripeFee !== null && { stripeFee })
      }
    })

    console.log('✅ Payment confirmed for booking', stripeFee !== null ? `with actual fee: ${stripeFee.toFixed(2)}€` : '')
  } catch (error) {
    console.error('❌ Error handling payment success:', error)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('❌ [STRIPE WEBHOOK] Payment failed:', paymentIntent.id)

    // Find booking before update
    const booking = await prisma.directBooking.findFirst({
      where: { stripePaymentId: paymentIntent.id },
      select: { id: true, status: true, paymentStatus: true, appointmentDate: true }
    })

    console.log('📋 [STRIPE WEBHOOK] Booking before cancel:', booking)

    // Update payment record
    await prisma.directBooking.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED'
      }
    })

    console.log('🚫 [STRIPE WEBHOOK] Booking marked as CANCELLED:', booking?.id)

    // Push notification to customer
    if (booking?.id) {
      try {
        const fullBooking = await prisma.directBooking.findUnique({
          where: { id: booking.id },
          include: { customer: { select: { user: { select: { id: true } } } } }
        })
        if (fullBooking?.customer?.user?.id) {
          await notifyBookingUpdate(fullBooking.customer.user.id, booking.id, 'CANCELLED')
        }
      } catch (pushErr) {
        console.error('❌ Push notification error:', pushErr)
      }
    }
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

    // Push notification to customer
    try {
      const refundedBooking = await prisma.directBooking.findFirst({
        where: { stripePaymentId: paymentIntentId },
        include: { customer: { select: { user: { select: { id: true } } } } }
      })
      if (refundedBooking?.customer?.user?.id) {
        await notifyBookingUpdate(refundedBooking.customer.user.id, refundedBooking.id, 'CANCELLED')
      }
    } catch (pushErr) {
      console.error('❌ Push notification error:', pushErr)
    }
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

    if (workshop) {
      // Update workshop status based on account verification
      if (isVerified && !hasRequirements) {
        if (!workshop.stripeEnabled) {
          await prisma.workshop.update({
            where: { id: workshop.id },
            data: { stripeEnabled: true }
          })
          console.log('✅ Stripe activated for workshop:', workshop.companyName)
        } else {
          console.log('ℹ️  Stripe already enabled for workshop:', workshop.companyName)
        }
      } else {
        if (workshop.stripeEnabled) {
          await prisma.workshop.update({
            where: { id: workshop.id },
            data: { stripeEnabled: false }
          })
          console.log('⚠️  Stripe disabled for workshop:', workshop.companyName)
        } else {
          console.log('ℹ️  Workshop still pending verification:', workshop.companyName)
          if (hasRequirements) {
            console.log('   Pending requirements:', requirementsCurrentlyDue.join(', '))
          }
        }
      }
      return
    }

    // Check if this is a freelancer Stripe account
    const freelancer = await prisma.freelancer.findFirst({
      where: { stripeAccountId: account.id }
    })

    if (freelancer) {
      const freelancerVerified = account.payouts_enabled
      if (freelancerVerified && !freelancer.stripeEnabled) {
        await prisma.freelancer.update({
          where: { id: freelancer.id },
          data: { stripeEnabled: true }
        })
        console.log('✅ Stripe payouts activated for freelancer:', freelancer.id)
      } else if (!freelancerVerified && freelancer.stripeEnabled) {
        await prisma.freelancer.update({
          where: { id: freelancer.id },
          data: { stripeEnabled: false }
        })
        console.log('⚠️  Stripe payouts disabled for freelancer:', freelancer.id)
      } else {
        console.log('ℹ️  Freelancer Stripe status unchanged:', freelancer.id)
      }
      return
    }

    console.log('⚠️  No workshop or freelancer found for Stripe account:', account.id)
  } catch (error) {
    console.error('❌ Error handling account update:', error)
  }
}

/**
 * Handle charge.updated event
 * Stripe fires this when balance_transaction becomes available (after checkout.session.completed)
 * We use this to backfill the real stripeFee on the booking.
 */
async function handleChargeUpdated(charge: Stripe.Charge, stripe: Stripe) {
  try {
    if (!charge.balance_transaction) return // not yet available
    if (!charge.payment_intent) return // no payment intent linked

    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent.id

    // Find the booking by stripePaymentId
    const booking = await prisma.directBooking.findFirst({
      where: { stripePaymentId: paymentIntentId, paymentStatus: 'PAID' },
      select: { id: true, stripeFee: true, paymentMethodDetail: true },
    })

    if (!booking) return
    if (booking.stripeFee !== null && booking.paymentMethodDetail !== null) return // already captured

    // Fetch balance transaction to get the real fee
    const balanceTransactionId = typeof charge.balance_transaction === 'string'
      ? charge.balance_transaction
      : charge.balance_transaction.id

    const balanceTx = await stripe.balanceTransactions.retrieve(balanceTransactionId)
    const feeInEuros = balanceTx.fee / 100
    const paymentMethodDetail = charge.payment_method_details?.type || null

    await prisma.directBooking.update({
      where: { id: booking.id },
      data: {
        ...(booking.stripeFee === null && { stripeFee: feeInEuros }),
        ...(booking.paymentMethodDetail === null && paymentMethodDetail && { paymentMethodDetail }),
      },
    })

    console.log(`✅ charge.updated → booking ${booking.id}: stripeFee=${feeInEuros}€, method=${paymentMethodDetail}`)
  } catch (error) {
    console.error('❌ Error handling charge.updated:', error)
  }
}

/**
 * Compute liability for a dispute based on booking date vs dispute date.
 * - Dispute BEFORE appointment → BEFORE_APPOINTMENT (Kunde hätte stornieren müssen, AGB §5.1)
 * - Dispute AFTER (or during) appointment → AFTER_APPOINTMENT (Werkstatt in Beweispflicht)
 * - No booking found → UNKNOWN
 */
function computeLiability(
  bookingDate: Date | null | undefined,
  bookingTime: string | null | undefined,
  disputeCreatedAt: Date
): 'BEFORE_APPOINTMENT' | 'AFTER_APPOINTMENT' | 'UNKNOWN' {
  if (!bookingDate) return 'UNKNOWN'
  const appointmentDateTime = new Date(bookingDate)
  if (bookingTime && /^\d{2}:\d{2}$/.test(bookingTime)) {
    const [h, m] = bookingTime.split(':').map(Number)
    appointmentDateTime.setHours(h, m, 0, 0)
  }
  return disputeCreatedAt < appointmentDateTime ? 'BEFORE_APPOINTMENT' : 'AFTER_APPOINTMENT'
}

/**
 * Handle charge.dispute.created / updated / closed
 * Upserts the Dispute record and links it to the related DirectBooking.
 */
async function handleDisputeEvent(dispute: Stripe.Dispute, eventType: string) {
  try {
    console.log(`⚠️  ${eventType}: ${dispute.id} (${dispute.status}, ${dispute.reason})`)

    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id
    const paymentIntentId = dispute.payment_intent
      ? (typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent.id)
      : null

    // Find related DirectBooking via stripePaymentId (PaymentIntent) or stripeSessionId fallback
    let booking = null
    if (paymentIntentId) {
      booking = await prisma.directBooking.findFirst({
        where: { stripePaymentId: paymentIntentId }
      })
    }
    if (!booking) {
      // Fallback: try by charge id stored in stripePaymentId field (legacy)
      booking = await prisma.directBooking.findFirst({
        where: { stripePaymentId: chargeId }
      })
    }

    const disputeCreatedAt = new Date(dispute.created * 1000)
    const evidenceDueBy = dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000)
      : null

    const liability = computeLiability(
      booking?.date ?? null,
      booking?.time ?? null,
      disputeCreatedAt
    )

    // Determine outcome on closed events
    let outcome: string | null = null
    if (dispute.status === 'won' || dispute.status === 'lost' || dispute.status === 'warning_closed') {
      outcome = dispute.status
    }

    const baseData = {
      stripeChargeId: chargeId,
      stripePaymentIntentId: paymentIntentId,
      directBookingId: booking?.id ?? null,
      workshopId: booking?.workshopId ?? null,
      customerId: booking?.customerId ?? null,
      bookingDate: booking?.date ?? null,
      bookingTime: booking?.time ?? null,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      evidenceDueBy,
      disputeCreatedAt,
      liability,
      ...(outcome ? { outcome } : {}),
    }

    await prisma.dispute.upsert({
      where: { stripeDisputeId: dispute.id },
      create: { stripeDisputeId: dispute.id, ...baseData },
      update: baseData,
    })

    console.log(`✅ Dispute ${dispute.id} stored (liability=${liability}, booking=${booking?.id ?? 'none'})`)
  } catch (error) {
    console.error('❌ Error handling dispute event:', error)
  }
}

async function handleDisputeFundsWithdrawn(dispute: Stripe.Dispute) {
  try {
    await prisma.dispute.update({
      where: { stripeDisputeId: dispute.id },
      data: { fundsWithdrawnAt: new Date(), status: dispute.status },
    }).catch(() => {
      // Dispute not yet stored - create via main handler first
      return handleDisputeEvent(dispute, 'charge.dispute.funds_withdrawn')
    })
    console.log(`💸 Dispute funds withdrawn: ${dispute.id}`)
  } catch (error) {
    console.error('❌ Error handling dispute.funds_withdrawn:', error)
  }
}

async function handleDisputeFundsReinstated(dispute: Stripe.Dispute) {
  try {
    await prisma.dispute.update({
      where: { stripeDisputeId: dispute.id },
      data: { fundsReinstatedAt: new Date(), status: dispute.status, outcome: 'won' },
    }).catch(() => handleDisputeEvent(dispute, 'charge.dispute.funds_reinstated'))
    console.log(`💰 Dispute funds reinstated: ${dispute.id}`)
  } catch (error) {
    console.error('❌ Error handling dispute.funds_reinstated:', error)
  }
}
