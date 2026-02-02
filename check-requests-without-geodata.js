const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRequestsWithoutGeodataData() {
  console.log('🔍 Suche TireRequests ohne Geo-Daten...\n')

  try {
    // Finde alle Anfragen ohne Koordinaten
    const requestsWithoutGeodata = await prisma.tireRequest.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                street: true,
                zipCode: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📊 ERGEBNIS: ${requestsWithoutGeodata.length} Anfragen ohne Geo-Daten gefunden\n`)
    console.log('═══════════════════════════════════════════════════════════════════════════\n')

    if (requestsWithoutGeodata.length === 0) {
      console.log('✅ Alle Anfragen haben Geo-Daten!\n')
      return
    }

    // Gruppiere nach Status
    const byStatus = {}
    requestsWithoutGeodata.forEach(req => {
      if (!byStatus[req.status]) {
        byStatus[req.status] = []
      }
      byStatus[req.status].push(req)
    })

    console.log('📈 NACH STATUS:\n')
    Object.keys(byStatus).forEach(status => {
      console.log(`  ${status}: ${byStatus[status].length} Anfragen`)
    })
    console.log('\n───────────────────────────────────────────────────────────────────────────\n')

    // Details anzeigen
    console.log('📋 DETAILS:\n')
    
    requestsWithoutGeodata.forEach((req, index) => {
      console.log(`${index + 1}. ID: ${req.id}`)
      console.log(`   Status: ${req.status}`)
      console.log(`   Erstellt: ${req.createdAt.toLocaleDateString('de-DE')} um ${req.createdAt.toLocaleTimeString('de-DE')}`)
      console.log(`   Service: ${req.serviceType || 'TIRE_CHANGE'}`)
      
      if (req.width === 0 && req.aspectRatio === 0 && req.diameter === 0) {
        console.log(`   Typ: ⚙️  Service-Anfrage`)
      } else {
        console.log(`   Reifengröße: ${req.width}/${req.aspectRatio} R${req.diameter}`)
      }
      
      console.log(`   \n   👤 Kunde:`)
      console.log(`      Name: ${req.customer.user.firstName} ${req.customer.user.lastName}`)
      console.log(`      Email: ${req.customer.user.email}`)
      console.log(`      Adresse: ${req.customer.user.street || 'NICHT ANGEGEBEN'}, ${req.customer.user.zipCode || 'KEINE PLZ'} ${req.customer.user.city || 'KEINE STADT'}`)
      
      console.log(`   \n   📍 Geo-Daten:`)
      console.log(`      Latitude: ${req.latitude || '❌ NULL'}`)
      console.log(`      Longitude: ${req.longitude || '❌ NULL'}`)
      console.log(`      PLZ (in Request): ${req.zipCode}`)
      console.log(`      Stadt (in Request): ${req.city || 'NICHT ANGEGEBEN'}`)
      
      if (req.additionalNotes) {
        console.log(`   \n   📝 Notizen: ${req.additionalNotes.substring(0, 100)}${req.additionalNotes.length > 100 ? '...' : ''}`)
      }
      
      console.log('\n───────────────────────────────────────────────────────────────────────────\n')
    })

    // Statistiken
    console.log('📊 STATISTIKEN:\n')
    
    const noStreet = requestsWithoutGeodata.filter(req => !req.customer.user.street)
    const noCity = requestsWithoutGeodata.filter(req => !req.customer.user.city)
    const hasAddress = requestsWithoutGeodata.filter(req => req.customer.user.street && req.customer.user.city)
    
    console.log(`  Anfragen ohne Straße: ${noStreet.length}`)
    console.log(`  Anfragen ohne Stadt: ${noCity.length}`)
    console.log(`  Anfragen MIT vollständiger Adresse (aber Geocoding fehlgeschlagen): ${hasAddress.length}`)
    
    console.log('\n───────────────────────────────────────────────────────────────────────────\n')
    
    // Zeige die mit vollständiger Adresse (Geocoding-Fehler)
    if (hasAddress.length > 0) {
      console.log('⚠️  ANFRAGEN MIT ADRESSE (Geocoding fehlgeschlagen):\n')
      hasAddress.forEach(req => {
        console.log(`  • ${req.id} - ${req.customer.user.street}, ${req.customer.user.zipCode} ${req.customer.user.city}`)
      })
      console.log('\n')
    }

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRequestsWithoutGeodataData()
