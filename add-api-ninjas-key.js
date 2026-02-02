const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addApiNinjasKey() {
  try {
    // Check if API_NINJAS_KEY already exists
    const existing = await prisma.adminApiSetting.findUnique({
      where: { key: 'API_NINJAS_KEY' }
    })

    if (existing) {
      console.log('✅ API_NINJAS_KEY already exists in database')
      console.log('   Current value:', existing.value ? '***configured***' : '(empty)')
      return
    }

    // Create new API_NINJAS_KEY entry
    const newKey = await prisma.adminApiSetting.create({
      data: {
        key: 'API_NINJAS_KEY',
        value: '', // Empty - user will fill it via admin UI
        description: 'API Ninjas Key für VIN Lookup und Fahrzeugsuche (50k Calls/Monat kostenlos - https://api-ninjas.com)'
      }
    })

    console.log('✅ API_NINJAS_KEY successfully added to database!')
    console.log('   ID:', newKey.id)
    console.log('   Key:', newKey.key)
    console.log('   Description:', newKey.description)
    console.log('')
    console.log('📝 Next steps:')
    console.log('   1. Go to: bereifung24.de/admin/api-settings')
    console.log('   2. Find the API_NINJAS_KEY field')
    console.log('   3. Enter your API key from api-ninjas.com')
    console.log('   4. Click "Speichern"')
    
  } catch (error) {
    console.error('❌ Error adding API_NINJAS_KEY:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addApiNinjasKey()
