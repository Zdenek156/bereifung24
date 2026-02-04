const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPayPalSettings() {
  console.log('\n🔍 Checking PayPal API Settings...\n')
  
  const settings = await prisma.adminApiSetting.findMany({
    where: {
      key: {
        startsWith: 'PAYPAL'
      }
    }
  })
  
  console.log('Found settings:')
  settings.forEach(s => {
    console.log(`- ${s.key}: ${s.value ? '✅ SET' : '❌ EMPTY'} (value length: ${s.value?.length || 0})`)
  })
  
  if (settings.length === 0) {
    console.log('\n❌ No PayPal settings found in database!')
    console.log('\n📝 Creating default PayPal settings...')
    
    await prisma.adminApiSetting.createMany({
      data: [
        {
          key: 'PAYPAL_CLIENT_ID',
          value: '',
          description: 'PayPal Client ID (Sandbox or Live)',
          category: 'PAYMENT'
        },
        {
          key: 'PAYPAL_CLIENT_SECRET',
          value: '',
          description: 'PayPal Client Secret (Sandbox or Live)',
          category: 'PAYMENT'
        },
        {
          key: 'PAYPAL_MODE',
          value: 'sandbox',
          description: 'PayPal Mode (sandbox or live)',
          category: 'PAYMENT'
        }
      ],
      skipDuplicates: true
    })
    
    console.log('✅ Default PayPal settings created!')
    console.log('\n👉 Go to /admin/api-settings and fill in the PayPal credentials')
  }
  
  await prisma.$disconnect()
}

checkPayPalSettings().catch(console.error)
