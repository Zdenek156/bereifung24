// Test GoCardless webhook signature verification
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function testWebhookSignature() {
  try {
    console.log('\n=== TESTING GOCARDLESS WEBHOOK SIGNATURE ===\n')

    // Get webhook secrets
    const dbSecret = await prisma.adminApiSetting.findUnique({
      where: { key: 'GOCARDLESS_WEBHOOK_SECRET' }
    })

    const envSecret = process.env.GOCARDLESS_WEBHOOK_SECRET

    console.log('📋 Configuration:')
    console.log(`   Database Secret: ${dbSecret?.value || 'NOT SET'}`)
    console.log(`   .env Secret: ${envSecret || 'NOT SET'}`)
    console.log()

    // Sample webhook payload (from GoCardless docs)
    const testPayload = JSON.stringify({
      events: [{
        id: 'EV123',
        resource_type: 'mandates',
        action: 'active',
        links: {
          mandate: 'MD01KDCNMHE94P'
        }
      }]
    })

    console.log('🧪 Test Payload:', testPayload)
    console.log()

    // Test signature with database secret
    if (dbSecret?.value) {
      const dbSignature = crypto
        .createHmac('sha256', dbSecret.value)
        .update(testPayload)
        .digest('hex')
      
      console.log('✅ Database Secret Signature:')
      console.log(`   ${dbSignature}`)
      console.log()
    }

    // Test signature with env secret
    if (envSecret) {
      const envSignature = crypto
        .createHmac('sha256', envSecret)
        .update(testPayload)
        .digest('hex')
      
      console.log('✅ Environment Secret Signature:')
      console.log(`   ${envSignature}`)
      console.log()
    }

    console.log('📝 Next Steps:')
    console.log('   1. Go to GoCardless Dashboard → Developers → Webhooks')
    console.log('   2. Click "Send test webhook"')
    console.log('   3. Check PM2 logs: pm2 logs bereifung24 --lines 50')
    console.log('   4. Look for webhook signature verification messages')
    console.log()
    console.log('   If signature verification fails:')
    console.log('   → The webhook secret in GoCardless does NOT match our configuration')
    console.log('   → Update the secret in Admin panel to match GoCardless')
    console.log()

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWebhookSignature()
