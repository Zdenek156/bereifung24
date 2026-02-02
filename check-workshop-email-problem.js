const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshop() {
  try {
    console.log('🔍 Suche Werkstatt: bikeanzeigen@gmail.com')
    console.log('=' .repeat(60))
    
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })
    
    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }
    
    console.log('\n✅ Werkstatt gefunden:')
    console.log(`   ID: ${workshop.id}`)
    console.log(`   Firmenname: ${workshop.companyName}`)
    console.log(`   User ID: ${workshop.user.id}`)
    console.log(`   Email: ${workshop.user.email}`)
    console.log(`   Name: ${workshop.user.firstName} ${workshop.user.lastName}`)
    console.log(`   Koordinaten: ${workshop.user.latitude}, ${workshop.user.longitude}`)
    
    console.log(`\n📧 EMAIL-BENACHRICHTIGUNGEN:`)
    console.log(`   emailNotifyRequests: ${workshop.emailNotifyRequests}`)
    console.log(`   emailNotifyOffers: ${workshop.emailNotifyOffers}`)
    console.log(`   emailNotifyBookings: ${workshop.emailNotifyBookings}`)
    
    if (!workshop.emailNotifyRequests) {
      console.log('\n⚠️  PROBLEM GEFUNDEN!')
      console.log('   E-Mail-Benachrichtigungen für neue Anfragen sind DEAKTIVIERT!')
    } else {
      console.log('\n✅ E-Mail-Benachrichtigungen für Anfragen sind aktiviert')
    }
    
    // Check all tire requests
    console.log('\n📋 Alle Reifenanfragen in der Datenbank (letzte 5):')
    console.log('-'.repeat(60))
    
    const allRequests = await prisma.tireRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        status: true,
        season: true,
        zipCode: true,
        city: true,
        latitude: true,
        longitude: true,
        workshopsNotified: true,
        customer: {
          select: { 
            user: {
              select: {
                firstName: true, 
                lastName: true, 
                email: true
              }
            }
          }
        }
      }
    })
    
    if (allRequests.length === 0) {
      console.log('   Keine Anfragen gefunden')
    } else {
      allRequests.forEach((r, i) => {
        console.log(`\n${i + 1}. Anfrage ID: ${r.id}`)
        console.log(`   Erstellt: ${r.createdAt.toLocaleString('de-DE')}`)
        console.log(`   Status: ${r.status}`)
        console.log(`   Saison: ${r.season}`)
        console.log(`   PLZ/Ort: ${r.zipCode} ${r.city || 'N/A'}`)
        console.log(`   Koordinaten: ${r.latitude}, ${r.longitude}`)
        console.log(`   Werkstätten benachrichtigt: ${r.workshopsNotified || 0}`)
        console.log(`   Kunde: ${r.customer.user.firstName} ${r.customer.user.lastName}`)
        
        // Calculate distance if coordinates are available
        if (r.latitude && r.longitude && workshop.user.latitude && workshop.user.longitude) {
          const distance = calculateDistance(
            r.latitude, 
            r.longitude, 
            workshop.user.latitude, 
            workshop.user.longitude
          )
          console.log(`   ⚡ Entfernung zur Werkstatt: ${distance.toFixed(1)} km`)
          
          if (distance > 50) {
            console.log(`   ⚠️  Anfrage außerhalb des 50km Radius - KEINE E-Mail gesendet!`)
          } else {
            console.log(`   ✅ Innerhalb 50km - E-Mail hätte gesendet werden sollen`)
          }
        } else {
          console.log(`   ❌ Keine Koordinaten - Entfernung kann nicht berechnet werden`)
        }
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('ANALYSE:')
    console.log('E-Mail-Benachrichtigungen werden nur gesendet wenn:')
    console.log('1. emailNotifyRequests = true (✅ erfüllt)')
    console.log('2. Anfrage hat Koordinaten (latitude/longitude)')
    console.log('3. Werkstatt hat Koordinaten')
    console.log('4. Entfernung < 50km')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180
}

checkWorkshop()
