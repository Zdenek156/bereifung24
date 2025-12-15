const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBrakeOffers() {
  try {
    // Finde alle Bremsen-Service Anfragen
    const brakeRequests = await prisma.tireRequest.findMany({
      where: {
        additionalNotes: {
          contains: 'BREMSEN-SERVICE'
        }
      },
      include: {
        offers: {
          include: {
            tireOptions: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    console.log(`\n🔍 Gefunden: ${brakeRequests.length} Bremsen-Service Anfragen\n`)

    for (const request of brakeRequests) {
      console.log(`\n📋 Anfrage ID: ${request.id}`)
      console.log(`   Kunde: ${request.customerName}`)
      console.log(`   Erstellt: ${request.createdAt}`)
      console.log(`   Angebote: ${request.offers.length}`)

      for (const offer of request.offers) {
        console.log(`\n   💼 Angebot ID: ${offer.id}`)
        console.log(`      Erstellt: ${offer.createdAt}`)
        console.log(`      ⏱️  Duration: ${offer.durationMinutes || 'NICHT GESETZT'} Minuten`)
        console.log(`      💰 Installation Fee: ${offer.installationFee} €`)
        console.log(`      🔧 Tire Options: ${offer.tireOptions.length}`)

        for (const option of offer.tireOptions) {
          console.log(`\n         Option ID: ${option.id}`)
          console.log(`         Brand: ${option.brand}`)
          console.log(`         Model: ${option.model}`)
          console.log(`         Preis: ${option.pricePerTire} €`)
          console.log(`         Achse: ${option.carTireType || 'NICHT GESETZT'}`)
          console.log(`         💸 Montage Price: ${option.montagePrice !== null ? option.montagePrice + ' €' : 'NICHT GESETZT'}`)
        }
      }
      console.log('\n' + '='.repeat(80))
    }

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBrakeOffers()
