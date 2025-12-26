const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addWeatherApiKey() {
  try {
    console.log('🔧 Adding WeatherAPI Key to database...')

    const result = await prisma.adminApiSetting.upsert({
      where: { key: 'WEATHERAPI_KEY' },
      update: { 
        value: '03cd650203354006bcb63909252612',
        description: 'WeatherAPI.com API Key für Wetter-basierte Reifenwechsel-Erinnerungen (1M Calls/Monat kostenlos)'
      },
      create: {
        key: 'WEATHERAPI_KEY',
        value: '03cd650203354006bcb63909252612',
        description: 'WeatherAPI.com API Key für Wetter-basierte Reifenwechsel-Erinnerungen (1M Calls/Monat kostenlos)'
      }
    })

    console.log('✅ WeatherAPI Key successfully added!')
    console.log('   Key:', result.key)
    console.log('   Value:', result.value.substring(0, 10) + '...')
    console.log('\n📍 You can now manage this key in the admin panel:')
    console.log('   https://bereifung24.de/admin/api-settings')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addWeatherApiKey()
