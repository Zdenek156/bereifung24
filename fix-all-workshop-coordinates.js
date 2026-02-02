const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAllWorkshopCoordinates() {
  try {
    console.log('🔍 Suche Werkstätten mit fehlenden coordinates...\n')

    // Finde alle Werkstätten ohne coordinates, aber mit User-Koordinaten
    const workshops = await prisma.workshop.findMany({
      where: {
        OR: [
          { coordinates: null },
          { coordinates: '' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })

    console.log(`Gefunden: ${workshops.length} Werkstätten ohne coordinates\n`)

    let fixed = 0
    let skipped = 0

    for (const workshop of workshops) {
      const hasUserCoords = workshop.user.latitude !== null && workshop.user.longitude !== null

      if (hasUserCoords) {
        const coordinates = `${workshop.user.latitude},${workshop.user.longitude}`
        
        console.log(`✅ Fixe ${workshop.companyName} (${workshop.user.email})`)
        console.log(`   Setze coordinates: ${coordinates}`)
        
        await prisma.workshop.update({
          where: { id: workshop.id },
          data: { coordinates }
        })
        
        fixed++
      } else {
        console.log(`⏭️  Überspringe ${workshop.companyName} - User hat keine Koordinaten`)
        skipped++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 ZUSAMMENFASSUNG:')
    console.log(`   ✅ Gefixt: ${fixed}`)
    console.log(`   ⏭️  Übersprungen: ${skipped}`)
    console.log(`   📍 Total: ${workshops.length}`)
    console.log('')

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllWorkshopCoordinates()
