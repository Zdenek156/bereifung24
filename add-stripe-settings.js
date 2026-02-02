const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addStripeSettings() {
  console.log('🔧 Adding Stripe API Settings...')

  const settings = [
    {
      key: 'STRIPE_SECRET_KEY',
      value: '',
      description: 'Stripe Secret Key (aus Stripe Dashboard > Developers > API keys - Format: sk_test_xxx oder sk_live_xxx)'
    },
    {
      key: 'STRIPE_PUBLISHABLE_KEY',
      value: '',
      description: 'Stripe Publishable Key (aus Stripe Dashboard > Developers > API keys - Format: pk_test_xxx oder pk_live_xxx)'
    }
  ]

  for (const setting of settings) {
    const existing = await prisma.adminApiSetting.findUnique({
      where: { key: setting.key }
    })

    if (existing) {
      console.log(`⚠️  ${setting.key} already exists, skipping...`)
    } else {
      await prisma.adminApiSetting.create({
        data: setting
      })
      console.log(`✅ Added ${setting.key}`)
    }
  }

  console.log('✅ Stripe API Settings added successfully!')
}

addStripeSettings()
  .catch((error) => {
    console.error('❌ Error adding Stripe settings:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
