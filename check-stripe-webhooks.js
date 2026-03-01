const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

async function checkWebhooks() {
  const prisma = new PrismaClient()
  
  try {
    console.log('\n🔍 Checking Stripe Webhook Configuration...\n')
    
    // Get Stripe API keys
    const stripeSecretKeySetting = await prisma.adminApiSetting.findUnique({
      where: { key: 'STRIPE_SECRET_KEY' }
    })
    
    const webhookSecretSetting = await prisma.adminApiSetting.findUnique({
      where: { key: 'STRIPE_WEBHOOK_SECRET' }
    })
    
    const stripeSecretKey = stripeSecretKeySetting?.value
    const webhookSecret = webhookSecretSetting?.value
    
    if (!stripeSecretKey) {
      console.log('❌ STRIPE_SECRET_KEY not found in database')
      return
    }
    
    console.log('✅ STRIPE_SECRET_KEY found:', stripeSecretKey.substring(0, 20) + '...')
    console.log('✅ STRIPE_WEBHOOK_SECRET found:', webhookSecret ? 'Yes (whsec_...)' : '❌ NO')
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia'
    })
    
    // List all webhook endpoints
    console.log('\n📋 Webhook Endpoints configured in Stripe:\n')
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })
    
    if (webhooks.data.length === 0) {
      console.log('❌ NO WEBHOOK ENDPOINTS CONFIGURED!')
      console.log('\n💡 This is why automatic Stripe fees are not captured.')
      console.log('   You need to create a webhook in Stripe Dashboard:')
      console.log('   URL: https://bereifung24.de/api/webhooks/stripe')
      console.log('   Events: checkout.session.completed, payment_intent.succeeded')
    } else {
      webhooks.data.forEach((webhook, index) => {
        console.log(`${index + 1}. Webhook Endpoint:`)
        console.log(`   ID: ${webhook.id}`)
        console.log(`   URL: ${webhook.url}`)
        console.log(`   Status: ${webhook.status}`)
        console.log(`   Secret: ${webhook.secret ? webhook.secret.substring(0, 20) + '...' : 'Not available via API'}`)
        console.log(`   Events (${webhook.enabled_events.length}):`)
        webhook.enabled_events.forEach(event => {
          const isRequired = ['checkout.session.completed', 'payment_intent.succeeded'].includes(event)
          console.log(`      ${isRequired ? '✅' : '  '} ${event}`)
        })
        console.log('')
      })
      
      // Check if required events are subscribed
      const hasCorrectUrl = webhooks.data.some(w => w.url.includes('bereifung24.de/api/webhooks/stripe'))
      const hasCheckoutCompleted = webhooks.data.some(w => w.enabled_events.includes('checkout.session.completed'))
      const hasPaymentIntentSucceeded = webhooks.data.some(w => w.enabled_events.includes('payment_intent.succeeded'))
      
      console.log('\n📊 Configuration Status:')
      console.log(`   ${hasCorrectUrl ? '✅' : '❌'} Correct URL (bereifung24.de/api/webhooks/stripe)`)
      console.log(`   ${hasCheckoutCompleted ? '✅' : '❌'} Event: checkout.session.completed`)
      console.log(`   ${hasPaymentIntentSucceeded ? '✅' : '⚠️'} Event: payment_intent.succeeded (optional but recommended)`)
      
      // Compare webhook secret
      if (hasCorrectUrl && webhookSecret) {
        const correctWebhook = webhooks.data.find(w => w.url.includes('bereifung24.de/api/webhooks/stripe'))
        if (correctWebhook && correctWebhook.secret) {
          const secretsMatch = correctWebhook.secret === webhookSecret
          console.log(`   ${secretsMatch ? '✅' : '❌'} Webhook Secret matches database: ${secretsMatch ? 'YES' : 'NO'}`)
          
          if (!secretsMatch) {
            console.log('\n⚠️  MISMATCH DETECTED!')
            console.log(`   Stripe secret: ${correctWebhook.secret.substring(0, 30)}...`)
            console.log(`   Database secret: ${webhookSecret.substring(0, 30)}...`)
          }
        } else {
          console.log('   ⚠️  Webhook secret not available via API (this is normal for Stripe)')
        }
      }
      
      if (!hasCorrectUrl) {
        console.log('\n❌ ISSUE: No webhook pointing to bereifung24.de/api/webhooks/stripe')
        console.log('   Current webhook URLs might be pointing to wrong domain.')
      }
      
      if (!hasCheckoutCompleted) {
        console.log('\n❌ ISSUE: checkout.session.completed event not subscribed')
        console.log('   This event is REQUIRED to capture Stripe fees automatically.')
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error checking webhooks:', error.message)
    if (error.type === 'StripeAuthenticationError') {
      console.log('   The Stripe API key might be invalid or test/live mode mismatch.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkWebhooks()
