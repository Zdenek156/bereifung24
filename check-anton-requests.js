const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAntonRequests() {
  try {
    // Suche nach Anfragen von Anton
    const requests = await prisma.tireRequest.findMany({
      where: {
        customer: {
          user: {
            OR: [
              { firstName: { contains: 'Anton', mode: 'insensitive' } },
              { lastName: { contains: 'Anton', mode: 'insensitive' } }
            ]
          }
        }
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        offers: {
          include: {
            workshop: {
              select: {
                id: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log('\n=== Anfragen von Anton ===\n')
    
    if (requests.length === 0) {
      console.log('Keine Anfragen von Anton gefunden!')
      return
    }

    requests.forEach((r, index) => {
      console.log(`--- Anfrage ${index + 1} ---`)
      console.log(`ID: ${r.id}`)
      console.log(`Name: ${r.customer.user.firstName} ${r.customer.user.lastName}`)
      console.log(`Email: ${r.customer.user.email}`)
      console.log(`Status: ${r.status}`)
      console.log(`Service: ${r.serviceType}`)
      console.log(`Erstellt: ${r.createdAt.toLocaleString('de-DE')}`)
      console.log(`Koordinaten: ${r.latitude}, ${r.longitude}`)
      console.log(`Adresse: ${r.customer.user.street || 'N/A'}, ${r.customer.user.zipCode || 'N/A'} ${r.customer.user.city || 'N/A'}`)
      console.log(`Anzahl Angebote: ${r.offers.length}`)
      
      if (r.offers.length > 0) {
        console.log('Angebote von:')
        r.offers.forEach(offer => {
          console.log(`  - ${offer.workshop.companyName} (${offer.status})`)
        })
      }
      
      console.log('')
    })

    // Jetzt prüfen wir die Luxus24 Werkstatt
    const luxus24 = await prisma.workshop.findFirst({
      where: {
        companyName: { contains: 'Luxus24', mode: 'insensitive' }
      },
      include: {
        user: true,
        workshopServices: true
      }
    })

    if (luxus24) {
      console.log('\n=== Werkstatt Luxus24 ===')
      console.log(`ID: ${luxus24.id}`)
      console.log(`Name: ${luxus24.companyName}`)
      console.log(`Radius: ${luxus24.serviceRadius} km`)
      console.log(`Koordinaten: ${luxus24.latitude}, ${luxus24.longitude}`)
      console.log(`Adresse: ${luxus24.user.street}, ${luxus24.user.zipCode} ${luxus24.user.city}`)
      console.log(`Services: ${luxus24.workshopServices.map(s => s.serviceType).join(', ')}`)
      console.log(`Status: ${luxus24.status}`)
      console.log(`Approved: ${luxus24.approved}`)
      console.log('')

      // Berechne Distanz zur neuesten Anfrage
      if (requests.length > 0 && requests[0].latitude && requests[0].longitude && luxus24.latitude && luxus24.longitude) {
        const lat1 = parseFloat(requests[0].latitude)
        const lon1 = parseFloat(requests[0].longitude)
        const lat2 = parseFloat(luxus24.latitude)
        const lon2 = parseFloat(luxus24.longitude)

        const R = 6371 // Erdradius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        console.log(`\n=== Distanz-Check ===`)
        console.log(`Distanz zur neuesten Anfrage: ${distance.toFixed(2)} km`)
        console.log(`Service-Radius von Luxus24: ${luxus24.serviceRadius} km`)
        console.log(`Innerhalb Radius: ${distance <= luxus24.serviceRadius ? '✅ JA' : '❌ NEIN'}`)
        console.log(`Service-Typ Match: ${luxus24.workshopServices.some(s => s.serviceType === requests[0].serviceType) ? '✅ JA' : '❌ NEIN'}`)
      }
    } else {
      console.log('\n❌ Werkstatt Luxus24 nicht gefunden!')
    }

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAntonRequests()
