const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()

// Simple getApiSetting implementation
async function getApiSetting(key) {
  const setting = await prisma.adminApiSetting.findUnique({
    where: { key }
  })
  return setting?.value || null
}

async function checkStripeFee() {
  try {
    console.log('🔍 Checking Stripe fee for latest booking...\n')

    // Get latest paid booking without stripeFee
    const booking = await prisma.directBooking.findFirst({
      where: {
        paymentStatus: 'PAID',
        stripeSessionId: { not: null }
      },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        stripeSessionId: true,
        stripePaymentId: true,
        stripeFee: true,
        totalPrice: true,
        paymentMethodDetail: true,
        paidAt: true,
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })

    if (!booking) {
      console.log('❌ No paid booking found')
      return
    }

    console.log('📦 Booking:', {
      id: booking.id,
      workshop: booking.workshop?.companyName,
      totalPrice: booking.totalPrice,
      paidAt: booking.paidAt,
      stripeSessionId: booking.stripeSessionId,
      stripePaymentId: booking.stripePaymentId,
      stripeFee: booking.stripeFee,
      paymentMethodDetail: booking.paymentMethodDetail
    })

    // Get Stripe credentials
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      console.log('\n❌ Stripe secret key not found in ApiSettings')
      return
    }

    console.log('\n✅ Stripe credentials found')

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })

    // Retrieve Checkout Session
    console.log('\n📡 Retrieving Checkout Session...')
    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId, {
      expand: ['payment_intent']
    })

    console.log('Session:', {
      id: session.id,
      paymentStatus: session.payment_status,
      paymentIntentId: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id
    })

    if (!session.payment_intent) {
      console.log('\n❌ No payment intent found in session')
      return
    }

    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent.id

    // Retrieve Payment Intent with latest charge
    console.log('\n📡 Retrieving Payment Intent...')
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge']
    })

    console.log('Payment Intent:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method_types
    })

    if (!paymentIntent.latest_charge) {
      console.log('\n❌ No charge found in payment intent')
      return
    }

    const charge = paymentIntent.latest_charge
    const balanceTransactionId = typeof charge.balance_transaction === 'string' 
      ? charge.balance_transaction 
      : charge.balance_transaction?.id

    if (!balanceTransactionId) {
      console.log('\n❌ No balance transaction found in charge')
      return
    }

    // Retrieve Balance Transaction
    console.log('\n📡 Retrieving Balance Transaction...')
    const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)

    const stripeFee = balanceTransaction.fee / 100
    const stripeFeePercent = (stripeFee / (balanceTransaction.amount / 100)) * 100

    console.log('\n💰 Balance Transaction:', {
      id: balanceTransaction.id,
      amount: balanceTransaction.amount / 100 + '€',
      fee: stripeFee + '€',
      feePercent: stripeFeePercent.toFixed(2) + '%',
      net: balanceTransaction.net / 100 + '€',
      type: balanceTransaction.type
    })

    // Get payment method details
    let paymentMethodDetail = 'Unbekannt'
    if (charge.payment_method_details) {
      paymentMethodDetail = charge.payment_method_details.type || 'Unbekannt'
      if (paymentMethodDetail === 'card' && charge.payment_method_details.card) {
        paymentMethodDetail = charge.payment_method_details.card.brand?.toUpperCase() || 'CARD'
      }
    }

    console.log('Payment Method:', paymentMethodDetail)

    // Update booking
    console.log('\n💾 Updating booking...')
    await prisma.directBooking.update({
      where: { id: booking.id },
      data: {
        stripeFee: stripeFee,
        stripePaymentId: paymentIntent.id,
        paymentMethodDetail: paymentMethodDetail
      }
    })

    console.log('✅ Booking updated!')
    console.log('\n📊 Summary:')
    console.log(`  - Booking Total: ${booking.totalPrice}€`)
    console.log(`  - Stripe Fee: ${stripeFee}€ (${stripeFeePercent.toFixed(2)}%)`)
    console.log(`  - Payment Method: ${paymentMethodDetail}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.raw) {
      console.error('Stripe Error:', error.raw)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkStripeFee()
