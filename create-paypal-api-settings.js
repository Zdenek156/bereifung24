// Run this on the server to create PayPal API settings
// node create-paypal-api-settings.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createPayPalSettings() {
  console.log('🔧 Creating PayPal API Settings...')
  
  try {
    // Check if they already exist
    const existing = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE']
        }
      }
    })
    
    console.log(`Found ${existing.length} existing PayPal settings`)
    
    if (existing.length === 0) {
      // Create new settings
      await prisma.adminApiSetting.createMany({
        data: [
          {
            key: 'PAYPAL_CLIENT_ID',
            value: '',
            description: 'PayPal Client ID (from PayPal Developer Dashboard)',
            category: 'PAYMENT',
            isPublic: false
          },
          {
            key: 'PAYPAL_CLIENT_SECRET',
            value: '',
            description: 'PayPal Client Secret (from PayPal Developer Dashboard)',
            category: 'PAYMENT',
            isPublic: false
          },
          {
            key: 'PAYPAL_MODE',
            value: 'sandbox',
            description: 'PayPal Environment Mode (sandbox or live)',
            category: 'PAYMENT',
            isPublic: false
          }
        ]
      })
      
      console.log('✅ PayPal API settings created successfully!')
      console.log('\n📝 Next steps:')
      console.log('1. Go to https://developer.paypal.com/dashboard/')
      console.log('2. Create or select an app')
      console.log('3. Copy Client ID and Secret')
      console.log('4. Go to /admin/api-settings on your website')
      console.log('5. Enter the PayPal credentials')
    } else {
      console.log('✅ PayPal settings already exist')
      existing.forEach(s => {
        const hasValue = s.value && s.value.length > 0
        console.log(`  - ${s.key}: ${hasValue ? '✅ SET' : '❌ EMPTY'}`)
      })
      
      if (existing.some(s => !s.value || s.value.length === 0)) {
        console.log('\n⚠️  Some settings are empty!')
        console.log('👉 Go to /admin/api-settings to fill them in')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createPayPalSettings()
