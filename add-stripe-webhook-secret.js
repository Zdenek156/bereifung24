const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addStripeWebhookSecret() {
  try {
    console.log('🔍 Suche nach STRIPE_WEBHOOK_SECRET...')
    
    // Prüfe ob STRIPE_WEBHOOK_SECRET bereits existiert
    const existing = await prisma.adminApiSetting.findUnique({
      where: { key: 'STRIPE_WEBHOOK_SECRET' }
    })

    if (existing) {
      console.log('✅ STRIPE_WEBHOOK_SECRET existiert bereits')
      console.log('   Key:', existing.key)
      console.log('   Value:', existing.value ? '***gesetzt***' : 'leer')
      return
    }

    console.log('📝 Erstelle STRIPE_WEBHOOK_SECRET...')
    
    // Erstelle STRIPE_WEBHOOK_SECRET
    const created = await prisma.adminApiSetting.create({
      data: {
        key: 'STRIPE_WEBHOOK_SECRET',
        value: '',
        description: 'Stripe Webhook Signing Secret (whsec_...) für Webhook-Verifizierung'
      }
    })

    console.log('✅ STRIPE_WEBHOOK_SECRET erfolgreich erstellt!')
    console.log('   Key:', created.key)
    console.log('   Description:', created.description)
    console.log('\n📝 Nächste Schritte:')
    console.log('   1. Gehe zu: https://bereifung24.de/admin/api-settings')
    console.log('   2. Fülle STRIPE_WEBHOOK_SECRET mit dem Secret aus Stripe ein')
    console.log('   3. Format: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx')

  } catch (error) {
    console.error('❌ Fehler:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

addStripeWebhookSecret()
