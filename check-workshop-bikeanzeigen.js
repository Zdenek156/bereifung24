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
            role: true
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
    console.log(`\n📧 EMAIL-BENACHRICHTIGUNGEN:`)
    console.log(`   emailNotifyRequests: ${workshop.emailNotifyRequests}`)
    console.log(`   emailNotifyOffers: ${workshop.emailNotifyOffers}`)
    console.log(`   emailNotifyBookings: ${workshop.emailNotifyBookings}`)
    
    if (!workshop.emailNotifyRequests) {
      console.log('\n⚠️  PROBLEM GEFUNDEN!')
      console.log('   E-Mail-Benachrichtigungen für neue Anfragen sind DEAKTIVIERT!')
      console.log('   Die Werkstatt erhält keine E-Mails bei neuen Anfragen.')
    } else {
      console.log('\n✅ E-Mail-Benachrichtigungen sind aktiviert')
    }
    
    // Find latest requests
    console.log('\n📋 Letzte 3 Anfragen für diese Werkstatt:')
    console.log('-'.repeat(60))
    
    const requests = await prisma.tireRequest.findMany({
      where: { workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        status: true,
        season: true,
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
    
    if (requests.length === 0) {
      console.log('   Keine Anfragen gefunden')
    } else {
      requests.forEach((r, i) => {
        console.log(`\n${i + 1}. Anfrage ID: ${r.id}`)
        console.log(`   Erstellt: ${r.createdAt.toLocaleString('de-DE')}`)
        console.log(`   Status: ${r.status}`)
        console.log(`   Saison: ${r.season}`)
        console.log(`   Kunde: ${r.customer.user.firstName} ${r.customer.user.lastName} (${r.customer.user.email})`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('LÖSUNG:')
    if (!workshop.emailNotifyRequests) {
      console.log('Die Werkstatt muss in den Einstellungen die Option')
      console.log('"E-Mail-Benachrichtigungen für neue Anfragen" aktivieren.')
      console.log('\nOder Administrator kann dies aktivieren mit:')
      console.log(`UPDATE workshops SET "emailNotifyRequests" = true WHERE id = '${workshop.id}';`)
    }
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshop()
