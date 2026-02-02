const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCoordinates() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          firstName: 'Otto',
          lastName: 'Fuchs'
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            street: true,
            zipCode: true,
            city: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden!')
      return
    }

    console.log('\n🏪 WERKSTATT-DATEN:')
    console.log('='.repeat(60))
    console.log(`Name: ${workshop.companyName}`)
    console.log(`Inhaber: ${workshop.user.firstName} ${workshop.user.lastName}`)
    console.log(`E-Mail: ${workshop.user.email}`)
    console.log('')
    console.log('📍 ADRESSE:')
    console.log(`   Straße: ${workshop.user.street}`)
    console.log(`   PLZ: ${workshop.user.zipCode}`)
    console.log(`   Stadt: ${workshop.user.city}`)
    console.log('')
    console.log('🗺️ KOORDINATEN:')
    console.log(`   Workshop.coordinates: ${workshop.coordinates || 'FEHLT! ❌'}`)
    console.log(`   User.latitude: ${workshop.user.latitude || 'FEHLT! ❌'}`)
    console.log(`   User.longitude: ${workshop.user.longitude || 'FEHLT! ❌'}`)
    console.log('')

    // Analyse
    const userHasCoordinates = workshop.user.latitude !== null && workshop.user.longitude !== null
    const workshopHasCoordinates = workshop.coordinates !== null && workshop.coordinates !== undefined

    if (userHasCoordinates && !workshopHasCoordinates) {
      console.log('⚠️ PROBLEM GEFUNDEN:')
      console.log('   User hat Koordinaten, aber Workshop.coordinates ist leer!')
      console.log('   Das coordinates-Feld wurde bei der Registrierung nicht gesetzt.')
      console.log('')
      console.log('🔧 LÖSUNG:')
      console.log(`   Workshop.coordinates sollte sein: "${workshop.user.latitude},${workshop.user.longitude}"`)
      console.log('')
      console.log('   Soll ich das jetzt fixen? (Führe fix-workshop-coordinates.js aus)')
    } else if (!userHasCoordinates && !workshopHasCoordinates) {
      console.log('❌ PROBLEM: Beide fehlen!')
      console.log('   Weder User noch Workshop haben Koordinaten.')
      console.log('   Geocoding ist bei der Registrierung fehlgeschlagen.')
      console.log('')
      console.log('🔧 LÖSUNG:')
      console.log('   Werkstatt muss Adresse in Einstellungen neu speichern (mit Geocoding)')
    } else if (userHasCoordinates && workshopHasCoordinates) {
      console.log('✅ Alles OK - beide haben Koordinaten')
    }

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCoordinates()
