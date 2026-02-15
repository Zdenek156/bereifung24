const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLatestBooking() {
  // Get the most recent DirectBooking
  const booking = await prisma.directBooking.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      workshop: {
        select: {
          id: true,
          name: true
        }
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          licensePlate: true
        }
      }
    }
  })
  
  if (!booking) {
    console.log('No bookings found')
    return
  }
  
  console.log('\n=== Latest DirectBooking ===\n')
  console.log(`ID: ${booking.id}`)
  console.log(`Created: ${booking.createdAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`)
  console.log(`\nCustomer: ${booking.customer.firstName} ${booking.customer.lastName} (${booking.customer.email})`)
  console.log(`Workshop: ${booking.workshop.name}`)
  console.log(`Vehicle: ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate})`)
  console.log(`\nService: ${booking.serviceType}`)
  console.log(`Date (stored): ${booking.date}`)
  console.log(`Date (ISO): ${booking.date.toISOString()}`)
  console.log(`Date (Berlin): ${booking.date.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`)
  console.log(`Time: ${booking.time}`)
  console.log(`\nStatus: ${booking.status}`)
  console.log(`Payment Status: ${booking.paymentStatus}`)
  console.log(`Payment Method: ${booking.paymentMethod}`)
  console.log(`Payment ID: ${booking.paymentId}`)
  console.log(`Paid At: ${booking.paidAt ? booking.paidAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) : 'NULL'}`)
  
  console.log(`\nTotal Price: ${booking.totalPrice}`)
  console.log(`Duration: ${booking.durationMinutes} min`)
}

checkLatestBooking()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
