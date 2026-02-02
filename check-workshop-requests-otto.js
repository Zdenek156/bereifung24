const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

async function checkWorkshopRequests() {
  try {
    // Finde Werkstatt von Otto Fuchs (aus dem Screenshot)
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          firstName: 'Otto',
          lastName: 'Fuchs'
        }
      },
      include: {
        user: true
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden!')
      return
    }

    console.log('\n🏪 WERKSTATT:')
    console.log('='.repeat(60))
    console.log(`Name: ${workshop.companyName}`)
    console.log(`Inhaber: ${workshop.user.firstName} ${workshop.user.lastName}`)
    console.log(`E-Mail: ${workshop.user.email}`)
    console.log(`Radius: ${workshop.radiusKm || 50} km`)
    console.log(`Koordinaten: ${workshop.coordinates}`)
    console.log(`isVerified: ${workshop.isVerified}`)
    console.log('')

    // Parse coordinates
    const [workshopLat, workshopLon] = workshop.coordinates 
      ? workshop.coordinates.split(',').map(c => parseFloat(c.trim()))
      : [null, null]

    if (!workshopLat || !workshopLon) {
      console.log('❌ Werkstatt hat keine Koordinaten!')
      return
    }

    // Hole alle offenen Reifenanfragen
    const requests = await prisma.tireRequest.findMany({
      where: {
        status: { in: ['PENDING', 'OFFER_SENT'] }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📋 GEFUNDENE ANFRAGEN: ${requests.length}`)
    console.log('='.repeat(60))

    let inRadius = 0
    let outOfRadius = 0

    for (const request of requests) {
      const [reqLat, reqLon] = request.coordinates
        ? request.coordinates.split(',').map(c => parseFloat(c.trim()))
        : [null, null]

      if (!reqLat || !reqLon) {
        console.log(`\n⚠️ Anfrage ${request.id.substring(0, 8)} - KEINE KOORDINATEN`)
        continue
      }

      const distance = calculateDistance(workshopLat, workshopLon, reqLat, reqLon)
      const withinRadius = distance <= (workshop.radiusKm || 50)

      if (withinRadius) {
        inRadius++
      } else {
        outOfRadius++
      }

      const icon = withinRadius ? '✅' : '❌'
      console.log(`\n${icon} Anfrage ${request.id.substring(0, 8)}:`)
      console.log(`   Kunde: ${request.user.firstName} ${request.user.lastName}`)
      console.log(`   Stadt: ${request.city}`)
      console.log(`   PLZ: ${request.zip}`)
      console.log(`   Entfernung: ${distance.toFixed(1)} km`)
      console.log(`   Im Radius (${workshop.radiusKm || 50} km): ${withinRadius ? 'JA ✅' : 'NEIN ❌'}`)
      console.log(`   Status: ${request.status}`)
      console.log(`   Erstellt: ${request.createdAt.toLocaleString('de-DE')}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 ZUSAMMENFASSUNG:')
    console.log(`   Anfragen im Radius: ${inRadius}`)
    console.log(`   Anfragen außerhalb: ${outOfRadius}`)
    console.log(`   Gesamt: ${requests.length}`)
    console.log('')

    if (outOfRadius > 0 && inRadius === 0) {
      console.log('⚠️ PROBLEM: Werkstatt sieht Anfragen außerhalb ihres Radius!')
    }

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopRequests()
