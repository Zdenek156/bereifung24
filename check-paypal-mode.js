const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPayPalMode() {
  try {
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          startsWith: 'PAYPAL_'
        }
      }
    })
    
    console.log('\n=== PayPal Settings ===')
    settings.forEach(setting => {
      if (setting.key === 'PAYPAL_CLIENT_SECRET' || setting.key === 'PAYPAL_CLIENT_ID') {
        console.log(`${setting.key}: ${setting.value.substring(0, 10)}...${setting.value.substring(setting.value.length - 10)}`)
      } else {
        console.log(`${setting.key}: ${setting.value}`)
      }
    })
    
    const mode = settings.find(s => s.key === 'PAYPAL_MODE')
    if (mode) {
      console.log('\n⚙️  Current Mode:', mode.value)
      if (mode.value === 'sandbox') {
        console.log('\n⚠️  SANDBOX MODE AKTIV!')
        console.log('   Im Sandbox-Modus musst du ein TEST-Käufer-Konto verwenden.')
        console.log('   Erstelle eins auf: https://developer.paypal.com/dashboard/accounts')
        console.log('\n   Oder wechsle auf LIVE-Modus für echte PayPal-Accounts.')
      } else {
        console.log('\n✅ LIVE MODE AKTIV - Echte PayPal-Accounts werden verwendet')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPayPalMode()
