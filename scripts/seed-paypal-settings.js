/**
 * Seed PayPal API Settings
 * Creates PayPal configuration entries in AdminApiSetting table
 * Run: node scripts/seed-paypal-settings.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Seeding PayPal API Settings...\n')

  const paypalSettings = [
    {
      key: 'PAYPAL_CLIENT_ID',
      value: '',
      description: 'PayPal REST API Client ID (aus PayPal Developer Dashboard → Apps & Credentials)'
    },
    {
      key: 'PAYPAL_CLIENT_SECRET',
      value: '',
      description: 'PayPal REST API Client Secret (aus PayPal Developer Dashboard → Apps & Credentials)'
    },
    {
      key: 'PAYPAL_WEBHOOK_ID',
      value: '',
      description: 'PayPal Webhook ID (nach Webhook-Erstellung im Dashboard - Format: WH-xxxxxxxxxxxxx)'
    },
    {
      key: 'PAYPAL_API_URL',
      value: 'https://api-m.sandbox.paypal.com',
      description: 'PayPal API URL (Sandbox: https://api-m.sandbox.paypal.com | Live: https://api-m.paypal.com)'
    }
  ]

  for (const setting of paypalSettings) {
    try {
      const result = await prisma.adminApiSetting.upsert({
        where: { key: setting.key },
        update: {
          description: setting.description,
          // Only update value if it's not empty
          ...(setting.value && { value: setting.value })
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description
        }
      })

      console.log(`✅ ${setting.key}: ${result.value ? 'Configured' : 'Ready for configuration'}`)
    } catch (error) {
      console.error(`❌ Error seeding ${setting.key}:`, error.message)
    }
  }

  console.log('\n✨ PayPal API Settings seeded successfully!')
  console.log('\n📋 Next steps:')
  console.log('1. Go to https://developer.paypal.com/dashboard/')
  console.log('2. Create or select your app')
  console.log('3. Copy Client ID & Secret')
  console.log('4. Create webhook: https://bereifung24.de/api/webhooks/paypal')
  console.log('5. Select events: PAYMENT.CAPTURE.COMPLETED, DENIED, REFUNDED')
  console.log('6. Copy Webhook ID (WH-xxxxxxxxxxxxx)')
  console.log('7. Enter all values in Admin → API-Einstellungen')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
