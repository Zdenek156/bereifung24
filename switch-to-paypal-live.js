const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve))
}

async function switchToLive() {
  try {
    console.log('\n🔴 ACHTUNG: Wechsel zu PayPal LIVE-Modus!')
    console.log('=' .repeat(50))
    console.log('Im Live-Modus werden ECHTE Zahlungen verarbeitet.\n')
    
    const confirm = await question('Möchtest du wirklich auf Live umstellen? (ja/nein): ')
    if (confirm.toLowerCase() !== 'ja') {
      console.log('Abgebrochen.')
      process.exit(0)
    }
    
    console.log('\n📝 Bitte gib deine PayPal LIVE Credentials ein:')
    console.log('(Zu finden auf: https://developer.paypal.com/dashboard/applications/live)\n')
    
    const liveClientId = await question('Live Client ID: ')
    const liveSecret = await question('Live Client Secret: ')
    
    if (!liveClientId || !liveSecret) {
      console.log('❌ Client ID und Secret sind erforderlich!')
      process.exit(1)
    }
    
    console.log('\n⚙️  Aktualisiere Datenbank...')
    
    // Update API URL to live
    await prisma.adminApiSetting.upsert({
      where: { key: 'PAYPAL_API_URL' },
      update: { value: 'https://api-m.paypal.com' },
      create: {
        key: 'PAYPAL_API_URL',
        value: 'https://api-m.paypal.com',
        category: 'PAYMENT',
        description: 'PayPal API URL (Live)'
      }
    })
    
    // Update Client ID
    await prisma.adminApiSetting.upsert({
      where: { key: 'PAYPAL_CLIENT_ID' },
      update: { value: liveClientId },
      create: {
        key: 'PAYPAL_CLIENT_ID',
        value: liveClientId,
        category: 'PAYMENT',
        description: 'PayPal Client ID (Live)'
      }
    })
    
    // Update Client Secret
    await prisma.adminApiSetting.upsert({
      where: { key: 'PAYPAL_CLIENT_SECRET' },
      update: { value: liveSecret },
      create: {
        key: 'PAYPAL_CLIENT_SECRET',
        value: liveSecret,
        category: 'PAYMENT',
        description: 'PayPal Client Secret (Live)'
      }
    })
    
    // Add MODE setting
    await prisma.adminApiSetting.upsert({
      where: { key: 'PAYPAL_MODE' },
      update: { value: 'live' },
      create: {
        key: 'PAYPAL_MODE',
        value: 'live',
        category: 'PAYMENT',
        description: 'PayPal Mode (sandbox/live)'
      }
    })
    
    console.log('\n✅ PayPal auf LIVE-Modus umgestellt!')
    console.log('=' .repeat(50))
    console.log('📌 API URL: https://api-m.paypal.com')
    console.log(`📌 Client ID: ${liveClientId.substring(0, 20)}...`)
    console.log('📌 Mode: LIVE')
    console.log('📌 SDK Version: v6')
    console.log('\n⚠️  Wichtig: Restart die App mit: pm2 restart bereifung24')
    console.log('⚠️  Echte Zahlungen werden jetzt verarbeitet!')
    console.log('⚠️  Kunden können mit echten PayPal-Accounts bezahlen!\n')
    
  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

switchToLive()
