const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testApiNinjas() {
  try {
    // Get API Key from database
    const setting = await prisma.adminApiSetting.findUnique({
      where: { key: 'API_NINJAS_KEY' }
    })

    if (!setting || !setting.value) {
      console.log('❌ API_NINJAS_KEY not found in database or empty')
      return
    }

    console.log('✅ API_NINJAS_KEY found in database')
    console.log('   Key length:', setting.value.length, 'characters')
    console.log('   First 10 chars:', setting.value.substring(0, 10))
    console.log('')

    // Test VIN lookup with API Ninjas
    const testVIN = 'WBAWY710500C9B457' // BMW from screenshot
    console.log('🔍 Testing VIN Lookup:', testVIN)
    console.log('')

    const response = await fetch(`https://api.api-ninjas.com/v1/vinlookup?vin=${testVIN}`, {
      headers: {
        'X-Api-Key': setting.value
      }
    })

    console.log('📡 API Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ API Error Response:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ API Success! Vehicle Data:')
    console.log(JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testApiNinjas()
