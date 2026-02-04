const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateToLive() {
  console.log('🔄 Updating PayPal to LIVE mode...\n')

  try {
    // Update API URL to live
    await prisma.adminApiSetting.upsert({
      where: { key: 'PAYPAL_API_URL' },
      update: { value: 'https://api-m.paypal.com' },
      create: {
        key: 'PAYPAL_API_URL',
        value: 'https://api-m.paypal.com'
      }
    })
    console.log('✅ PAYPAL_API_URL: https://api-m.paypal.com')

    // Set mode to live
    await prisma.adminApiSetting.upsert({
      where: { key: 'PAYPAL_MODE' },
      update: { value: 'live' },
      create: {
        key: 'PAYPAL_MODE',
        value: 'live'
      }
    })
    console.log('✅ PAYPAL_MODE: live')

    console.log('\n' + '='.repeat(50))
    console.log('✅ PayPal erfolgreich auf LIVE-Modus umgestellt!')
    console.log('='.repeat(50))
    console.log('\n📌 SDK Version: v6')
    console.log('📌 Live Credentials: Bereits gespeichert')
    console.log('📌 Webhook URL: https://bereifung24.de/api/webhooks/paypal')
    console.log('\n⚠️  WICHTIG: Restart erforderlich!')
    console.log('   Führe aus: pm2 restart bereifung24\n')
    console.log('⚠️  ECHTE ZAHLUNGEN werden jetzt verarbeitet!')
    console.log('⚠️  Kunden können mit echten PayPal-Accounts bezahlen!\n')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateToLive()
