const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshop() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' },
      select: {
        id: true,
        companyName: true,
        latitude: true,
        longitude: true,
        openingHours: true
      }
    })
    
    console.log('Luxus24 Workshop:')
    console.log(JSON.stringify(workshop, null, 2))
    
    if (!workshop.latitude || !workshop.longitude) {
      console.log('\n⚠️  Keine Geo-Koordinaten vorhanden!')
    }
    
    if (!workshop.openingHours) {
      console.log('\n⚠️  Keine Öffnungszeiten vorhanden!')
      console.log('\nVorschlag zum Hinzufügen:')
      console.log(`UPDATE "Workshop" SET "openingHours" = '{"monday":{"from":"08:00","to":"18:00","closed":false},"tuesday":{"from":"08:00","to":"18:00","closed":false},"wednesday":{"from":"08:00","to":"18:00","closed":false},"thursday":{"from":"08:00","to":"18:00","closed":false},"friday":{"from":"08:00","to":"18:00","closed":false},"saturday":{"from":"09:00","to":"13:00","closed":false},"sunday":{"closed":true}}' WHERE id = '${workshop.id}';`)
    } else {
      console.log('\n✅ Öffnungszeiten vorhanden')
    }
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshop()
