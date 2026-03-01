const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()

async function getApiSetting(key) {
  const setting = await prisma.adminApiSetting.findUnique({
    where: { key }
  })
  return setting?.value || null
}

async function fetchLatestStripeFee() {
  try {
    // Get the latest booking
    const latestBooking = await prisma.directBooking.findFirst({
      where: {
        paymentStatus: 'PAID'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        date: true,
        time: true,
        totalPrice: true,
        stripePaymentId: true,
        stripeSessionId: true,
        paymentStatus: true,
        stripeFee: true,
        paymentMethodDetail: true,
        createdAt: true
      }
    })

    if (!latestBooking) {
      console.log('❌ No paid bookings found')
      return
    }

    console.log('\n📦 Latest Booking:')
    console.log('ID:', latestBooking.id)
    console.log('Date/Time:', latestBooking.date, latestBooking.time)
    console.log('Total:', Number(latestBooking.totalPrice).toFixed(2), '€')
    console.log('Created:', latestBooking.createdAt)
    console.log('Payment Status:', latestBooking.paymentStatus)
    console.log('Stripe Session ID:', latestBooking.stripeSessionId || 'NULL')
    console.log('Stripe Payment ID:', latestBooking.stripePaymentId || 'NULL')
    console.log('Current stripeFee:', latestBooking.stripeFee ? Number(latestBooking.stripeFee).toFixed(2) + ' €' : 'NULL')
    console.log('Payment Method:', latestBooking.paymentMethodDetail || 'NULL')

    if (!latestBooking.stripePaymentId && !latestBooking.stripeSessionId) {
      console.log('❌ No Stripe Payment Intent ID or Session ID found')
      return
    }

    // Get Stripe credentials
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.log('❌ Stripe secret key not found in database')
      return
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia'
    })

    console.log('\n🔍 Fetching from Stripe API...')
    
    let paymentIntent
    
    // Try to get payment intent from session if no direct payment ID
    if (!latestBooking.stripePaymentId && latestBooking.stripeSessionId) {
      console.log('Retrieving session to get payment intent...')
      const session = await stripe.checkout.sessions.retrieve(latestBooking.stripeSessionId)
      console.log('Session status:', session.payment_status)
      console.log('Payment Intent from session:', session.payment_intent)
      
      if (!session.payment_intent) {
        console.log('❌ No payment intent in session')
        return
      }
      
      paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
        {
          expand: ['latest_charge', 'latest_charge.balance_transaction']
        }
      )
    } else {
      // Retrieve payment intent with expanded charge
      paymentIntent = await stripe.paymentIntents.retrieve(
        latestBooking.stripePaymentId,
      {
        expand: ['latest_charge', 'latest_charge.balance_transaction']
      }
    )    }
    console.log('\n💳 Payment Intent:', paymentIntent.id)
    console.log('Status:', paymentIntent.status)
    console.log('Amount:', (paymentIntent.amount / 100).toFixed(2), '€')

    if (paymentIntent.latest_charge && typeof paymentIntent.latest_charge === 'object') {
      const charge = paymentIntent.latest_charge
      console.log('\n⚡ Charge:', charge.id)
      
      if (charge.payment_method_details) {
        const pmType = charge.payment_method_details.type
        const pmDetails = charge.payment_method_details[pmType]
        
        console.log('Payment Method Type:', pmType)
        if (pmDetails.brand) console.log('Brand:', pmDetails.brand)
        if (pmDetails.country) console.log('Card Country:', pmDetails.country)
        if (pmDetails.funding) console.log('Funding:', pmDetails.funding)
      }

      if (charge.balance_transaction && typeof charge.balance_transaction === 'object') {
        const balanceTx = charge.balance_transaction
        const feeAmount = balanceTx.fee / 100
        const netAmount = balanceTx.net / 100
        
        console.log('\n💰 Balance Transaction:', balanceTx.id)
        console.log('Fee:', feeAmount.toFixed(2), '€')
        console.log('Net:', netAmount.toFixed(2), '€')
        console.log('Fee %:', ((feeAmount / (paymentIntent.amount / 100)) * 100).toFixed(2) + '%')

        // Extract payment method detail
        let paymentMethodDetail = 'Unknown'
        if (charge.payment_method_details) {
          const pmType = charge.payment_method_details.type
          const pmDetails = charge.payment_method_details[pmType]
          
          if (pmType === 'card' && pmDetails.brand) {
            paymentMethodDetail = pmDetails.brand.toUpperCase()
          } else if (pmType === 'paypal') {
            paymentMethodDetail = 'PayPal'
          } else {
            paymentMethodDetail = pmType
          }
        }

        // Update database
        console.log('\n💾 Updating database...')
        await prisma.directBooking.update({
          where: { id: latestBooking.id },
          data: {
            stripeFee: feeAmount,
            paymentMethodDetail: paymentMethodDetail
          }
        })

        console.log('✅ Updated booking with:')
        console.log('   stripeFee:', feeAmount.toFixed(2), '€')
        console.log('   paymentMethodDetail:', paymentMethodDetail)
      } else {
        console.log('❌ Balance transaction not available')
      }
    } else {
      console.log('❌ Latest charge not available')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchLatestStripeFee()
