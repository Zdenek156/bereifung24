const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()

async function getApiSetting(key) {
  const setting = await prisma.adminApiSetting.findUnique({
    where: { key }
  })
  return setting?.value || null
}

async function checkStripeDetails() {
  try {
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')
    
    if (!stripeSecretKey) {
      console.log('❌ Stripe secret key not found')
      return
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })
    
    // Get Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve('pi_3T3GAp2K1l628RwT1Sg6hHUX', {
      expand: ['latest_charge', 'latest_charge.balance_transaction']
    })

    console.log('\n💳 Card Details:')
    const charge = paymentIntent.latest_charge
    if (charge.payment_method_details?.card) {
      const card = charge.payment_method_details.card
      console.log('  Brand:', card.brand?.toUpperCase())
      console.log('  Country:', card.country)
      console.log('  Funding:', card.funding) // credit, debit, prepaid
      console.log('  Network:', card.network)
    }

    console.log('\n💰 Balance Transaction:')
    const balanceTx = charge.balance_transaction
    console.log('  Amount:', balanceTx.amount / 100, '€')
    console.log('  Fee:', balanceTx.fee / 100, '€')
    console.log('  Net:', balanceTx.net / 100, '€')
    console.log('  Exchange Rate:', balanceTx.exchange_rate || 'N/A')
    console.log('  Description:', balanceTx.description)
    
    console.log('\n📊 Fee Details:')
    if (balanceTx.fee_details) {
      balanceTx.fee_details.forEach(fee => {
        console.log(`  ${fee.type}: ${(fee.amount / 100).toFixed(2)}€ (${fee.description})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkStripeDetails()
