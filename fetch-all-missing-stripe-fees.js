const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()

async function getApiSetting(key) {
  const setting = await prisma.adminApiSetting.findUnique({
    where: { key }
  })
  return setting?.value || null
}

async function fetchAllMissingStripeFees() {
  try {
    // Get all PAID bookings without stripeFee
    const bookingsWithoutFees = await prisma.directBooking.findMany({
      where: {
        paymentStatus: 'PAID',
        stripeFee: null,
        stripeSessionId: {
          not: null
        }
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
        stripeFee: true,
        paymentMethodDetail: true,
        createdAt: true
      }
    })

    console.log(`\n Found ${bookingsWithoutFees.length} bookings without Stripe fees\n`)

    if (bookingsWithoutFees.length === 0) {
      console.log('✅ All bookings have Stripe fees recorded!')
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

    let successCount = 0
    let failCount = 0

    for (const booking of bookingsWithoutFees) {
      try {
        console.log(`\n📦 Booking: ${booking.id}`)
        console.log(`   Date: ${booking.date.toISOString().split('T')[0]} ${booking.time}`)
        console.log(`   Total: ${Number(booking.totalPrice).toFixed(2)} €`)
        console.log(`   Session ID: ${booking.stripeSessionId}`)

        // Retrieve session to get payment intent
        const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId)
        
        if (!session.payment_intent) {
          console.log('   ❌ No payment intent in session')
          failCount++
          continue
        }

        // Retrieve payment intent with expanded balance transaction
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent,
          {
            expand: ['latest_charge', 'latest_charge.balance_transaction']
          }
        )

        if (!paymentIntent.latest_charge || typeof paymentIntent.latest_charge !== 'object') {
          console.log('   ❌ No charge found')
          failCount++
          continue
        }

        const charge = paymentIntent.latest_charge

        if (!charge.balance_transaction || typeof charge.balance_transaction !== 'object') {
          console.log('   ❌ No balance transaction found')
          failCount++
          continue
        }

        const balanceTx = charge.balance_transaction
        const feeAmount = balanceTx.fee / 100
        const feePercent = ((feeAmount / (paymentIntent.amount / 100)) * 100).toFixed(2)

        console.log(`   💰 Fee: ${feeAmount.toFixed(2)} € (${feePercent}%)`)

        // Extract payment method detail
        let paymentMethodDetail = 'Unknown'
        if (charge.payment_method_details) {
          const pmType = charge.payment_method_details.type
          const pmDetails = charge.payment_method_details[pmType]
          
          if (pmType === 'card' && pmDetails.brand) {
            paymentMethodDetail = pmDetails.brand.toUpperCase()
            if (pmDetails.country) {
              paymentMethodDetail += ` (${pmDetails.country})`
            }
          } else if (pmType === 'paypal') {
            paymentMethodDetail = 'PayPal'
          } else {
            paymentMethodDetail = pmType
          }
        }

        console.log(`   💳 Payment: ${paymentMethodDetail}`)

        // Update database
        await prisma.directBooking.update({
          where: { id: booking.id },
          data: {
            stripeFee: feeAmount,
            paymentMethodDetail: paymentMethodDetail
          }
        })

        console.log(`   ✅ Updated!`)
        successCount++

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        failCount++
      }
    }

    console.log(`\n\n📊 Summary:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log(`   📝 Total: ${bookingsWithoutFees.length}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

fetchAllMissingStripeFees()
