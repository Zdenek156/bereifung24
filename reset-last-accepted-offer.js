const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetLastAcceptedOffer() {
  try {
    // Find the most recent accepted offer
    const lastAcceptedOffer = await prisma.offer.findFirst({
      where: {
        status: 'ACCEPTED'
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        tireRequest: {
          include: {
            customer: true
          }
        },
        workshop: true
      }
    })

    if (!lastAcceptedOffer) {
      console.log('❌ Kein akzeptiertes Angebot gefunden')
      return
    }

    console.log('\n📋 Letztes akzeptiertes Angebot gefunden:')
    console.log(`   Offer ID: ${lastAcceptedOffer.id}`)
    console.log(`   Kunde: ${lastAcceptedOffer.tireRequest.customer.email}`)
    console.log(`   Werkstatt: ${lastAcceptedOffer.workshop.companyName}`)
    console.log(`   Angenommen am: ${lastAcceptedOffer.updatedAt.toLocaleString('de-DE')}`)
    console.log(`   Preis: ${lastAcceptedOffer.price}€`)

    // Find all bookings for this tire request
    const bookings = await prisma.booking.findMany({
      where: {
        tireRequestId: lastAcceptedOffer.tireRequestId
      }
    })

    if (bookings.length > 0) {
      console.log(`\n🗓️  ${bookings.length} Buchung(en) gefunden:`)
      bookings.forEach(booking => {
        console.log(`   - Booking ID: ${booking.id}`)
        console.log(`     Status: ${booking.status}`)
        if (booking.appointmentDate) {
          console.log(`     Termin: ${booking.appointmentDate.toLocaleString('de-DE')}`)
        }
      })

      // Delete all commissions for these bookings first
      for (const booking of bookings) {
        const commissions = await prisma.commission.deleteMany({
          where: {
            bookingId: booking.id
          }
        })
        if (commissions.count > 0) {
          console.log(`   ✅ ${commissions.count} Commission(s) für Booking ${booking.id} gelöscht`)
        }
      }

      // Delete all bookings
      await prisma.booking.deleteMany({
        where: {
          tireRequestId: lastAcceptedOffer.tireRequestId
        }
      })
      console.log(`\n✅ ${bookings.length} Buchung(en) gelöscht`)
    } else {
      console.log('\nℹ️  Keine Buchungen vorhanden')
    }

    // Reset offer status to PENDING
    await prisma.offer.update({
      where: {
        id: lastAcceptedOffer.id
      },
      data: {
        status: 'PENDING'
      }
    })

    console.log('\n✅ Angebot zurückgesetzt auf PENDING')
    
    // Reset tire request status to OFFERS_RECEIVED
    await prisma.tireRequest.update({
      where: {
        id: lastAcceptedOffer.tireRequestId
      },
      data: {
        status: 'OFFERS_RECEIVED'
      }
    })

    console.log('✅ Anfrage zurückgesetzt auf OFFERS_RECEIVED')
    
    console.log('\n🎉 Fertig! Sie können das Angebot jetzt erneut annehmen und testen.')
    console.log(`\n📝 Details:`)
    console.log(`   Request ID: ${lastAcceptedOffer.tireRequestId}`)
    console.log(`   Offer ID: ${lastAcceptedOffer.id}`)

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetLastAcceptedOffer()
