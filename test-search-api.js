const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testSearchAPI() {
  try {
    console.log('🔍 Testing Workshop Search API...\n')
    
    // Find workshop named Luxus24
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Luxus24',
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            street: true,
            city: true,
            zipCode: true
          }
        }
      }
    })
    
    if (!workshop) {
      console.log('❌ Workshop Luxus24 nicht gefunden')
      return
    }
    
    console.log('✅ Workshop gefunden:', workshop.companyName)
    console.log('\n📍 Adressdaten aus User-Relation:')
    console.log('  - Stadt:', workshop.user?.city || 'NULL')
    console.log('  - Straße:', workshop.user?.street || 'NULL')
    console.log('  - PLZ:', workshop.user?.zipCode || 'NULL')
    console.log('  - Email:', workshop.user?.email || 'NULL')
    console.log('  - Telefon:', workshop.user?.phone || 'NULL')
    
    console.log('\n🕐 Öffnungszeiten:')
    console.log('  - Rohdaten:', workshop.openingHours)
    
    if (workshop.openingHours) {
      try {
        const hours = JSON.parse(workshop.openingHours)
        console.log('  - Parsed JSON:', JSON.stringify(hours, null, 2))
        
        const today = new Date().toLocaleDateString('de-DE', { weekday: 'long' }).toLowerCase()
        console.log('  - Heute:', today)
        console.log('  - Heute Öffnungszeiten:', hours[today])
      } catch (e) {
        console.log('  - ❌ Fehler beim Parsen:', e.message)
      }
    }
    
    // Test what the API would return
    console.log('\n📤 API würde zurückgeben:')
    console.log({
      id: workshop.id,
      name: workshop.companyName,
      address: workshop.user?.street || null,
      city: workshop.user?.city || null,
      postalCode: workshop.user?.zipCode || null,
      openingHours: workshop.openingHours || null,
      phone: workshop.user?.phone,
      email: workshop.user?.email
    })
    
  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSearchAPI()
