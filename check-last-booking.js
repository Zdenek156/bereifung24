const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLastBooking() {
  try {
    const lastBooking = await prisma.directBooking.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: {
          select: {
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (lastBooking) {
      console.log('\n✅ Letzte Buchung gefunden:\n')
      console.log('ID:', lastBooking.id)
      console.log('Buchungsnummer:', lastBooking.bookingNumber)
      console.log('Service:', lastBooking.serviceType)
      console.log('Datum:', lastBooking.date)
      console.log('Zeit:', lastBooking.time)
      console.log('Status:', lastBooking.status)
      console.log('Payment Status:', lastBooking.paymentStatus)
      console.log('Preis:', lastBooking.totalPrice.toString(), 'EUR')
      console.log('\nKunde:', lastBooking.customer.name, '-', lastBooking.customer.email)
      console.log('Werkstatt:', lastBooking.workshop.name)
      console.log('Fahrzeug:', lastBooking.vehicle.brand, lastBooking.vehicle.model, '-', lastBooking.vehicle.licensePlate)
      console.log('\nErstellt am:', lastBooking.createdAt)
    } else {
      console.log('❌ Keine Buchungen gefunden')
    }

    // Alle Buchungen zählen
    const totalBookings = await prisma.directBooking.count()
    console.log('\n📊 Gesamt Buchungen:', totalBookings)

    // Buchungen nach Status
    const byStatus = await prisma.directBooking.groupBy({
      by: ['status'],
      _count: true
    })
    console.log('\nBuchungen nach Status:')
    byStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`))

    // Buchungen nach Payment Status
    const byPayment = await prisma.directBooking.groupBy({
      by: ['paymentStatus'],
      _count: true
    })
    console.log('\nBuchungen nach Payment Status:')
    byPayment.forEach(s => console.log(`  ${s.paymentStatus}: ${s._count}`))

  } catch (error) {
    console.error('Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkLastBooking()
