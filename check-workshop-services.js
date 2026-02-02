const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshopServices() {
  try {
    console.log('🔍 Überprüfe Werkstatt-Services für bikeanzeigen@gmail.com')
    console.log('=' .repeat(70))
    
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
            latitude: true,
            longitude: true
          }
        },
        workshopServices: true
      }
    })
    
    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }
    
    console.log('\n✅ Werkstatt gefunden:')
    console.log(`   ID: ${workshop.id}`)
    console.log(`   Firmenname: ${workshop.companyName}`)
    console.log(`   Email: ${workshop.user.email}`)
    console.log(`   Koordinaten: ${workshop.user.latitude}, ${workshop.user.longitude}`)
    console.log(`   Verifiziert: ${workshop.isVerified ? '✅ JA' : '❌ NEIN'}`)
    
    console.log('\n📧 E-Mail-Einstellungen:')
    console.log(`   emailNotifyRequests: ${workshop.emailNotifyRequests ? '✅ AN' : '❌ AUS'}`)
    console.log(`   emailNotifyOffers: ${workshop.emailNotifyOffers ? '✅ AN' : '❌ AUS'}`)
    console.log(`   emailNotifyBookings: ${workshop.emailNotifyBookings ? '✅ AN' : '❌ AUS'}`)
    
    console.log('\n🛠️  AKTIVE SERVICES:')
    console.log('-'.repeat(70))
    
    if (workshop.workshopServices.length === 0) {
      console.log('   ❌ KEINE SERVICES KONFIGURIERT!')
      console.log('   Das ist das Problem! Die Werkstatt muss Services aktivieren.')
    } else {
      const services = workshop.workshopServices
      
      services.forEach(ws => {
        const status = ws.isActive ? '✅ AKTIV' : '❌ INAKTIV'
        console.log(`   ${status} - ${ws.serviceType}`)
        
        if (ws.serviceType === 'TIRE_CHANGE') {
          console.log(`      ⚡ Dies ist der Service für normale Reifenanfragen!`)
        }
      })
      
      // Check if TIRE_CHANGE is active
      const tireChangeService = services.find(s => s.serviceType === 'TIRE_CHANGE')
      
      console.log('\n🎯 DIAGNOSE:')
      console.log('-'.repeat(70))
      
      if (!tireChangeService) {
        console.log('❌ PROBLEM GEFUNDEN!')
        console.log('   Der Service "TIRE_CHANGE" ist NICHT konfiguriert!')
        console.log('   Normale Reifenanfragen benötigen diesen Service.')
        console.log('\n💡 LÖSUNG:')
        console.log('   Die Werkstatt muss in den Einstellungen den Service')
        console.log('   "Reifenwechsel" (TIRE_CHANGE) aktivieren.')
      } else if (!tireChangeService.isActive) {
        console.log('❌ PROBLEM GEFUNDEN!')
        console.log('   Der Service "TIRE_CHANGE" ist INAKTIV!')
        console.log('\n💡 LÖSUNG:')
        console.log('   Die Werkstatt muss in den Einstellungen den Service')
        console.log('   "Reifenwechsel" aktivieren.')
      } else {
        console.log('✅ TIRE_CHANGE Service ist aktiv')
        console.log('✅ E-Mail-Benachrichtigungen sind aktiviert')
        console.log('✅ Werkstatt ist verifiziert')
        console.log('✅ Koordinaten sind vorhanden')
        console.log('\n✨ Alle Voraussetzungen sind erfüllt!')
        console.log('   Die Werkstatt sollte E-Mails für neue Anfragen erhalten.')
      }
    }
    
    // Check all workshops with TIRE_CHANGE service active
    console.log('\n\n📊 Vergleich: Andere Werkstätten mit TIRE_CHANGE Service:')
    console.log('-'.repeat(70))
    
    const otherWorkshops = await prisma.workshop.findMany({
      where: {
        isVerified: true,
        workshopServices: {
          some: {
            serviceType: 'TIRE_CHANGE',
            isActive: true
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            latitude: true,
            longitude: true
          }
        }
      },
      take: 5
    })
    
    console.log(`\nGefunden: ${otherWorkshops.length} Werkstätten mit aktivem TIRE_CHANGE`)
    otherWorkshops.forEach((ws, i) => {
      console.log(`${i + 1}. ${ws.companyName} - ${ws.user.email}`)
      console.log(`   Verifiziert: ${ws.isVerified ? 'Ja' : 'Nein'}, Koordinaten: ${ws.user.latitude ? 'Ja' : 'Nein'}`)
    })
    
    console.log('\n' + '='.repeat(70))
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopServices()
