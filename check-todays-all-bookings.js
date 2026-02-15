const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTodaysBookings() {
  const bookings = await prisma.directBooking.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-02-10T00:00:00Z'),
        lt: new Date('2026-02-11T00:00:00Z')
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('\n=== DirectBookings created on Feb 10, 2026 ===\n')
  
  for (const b of bookings) {
    console.log(`${b.id}`)
    console.log(`  Created: ${b.createdAt.toLocaleString('de-DE')}`)
    console.log(`  Appointment: ${b.date.toLocaleDateString('de-DE')} um ${b.time}`)
    console.log(`  Status: ${b.status}`)
    console.log(`  PaymentStatus: ${b.paymentStatus}`)
    console.log(`  PaymentMethod: ${b.paymentMethod}`)
    console.log(`  PaymentId: ${b.paymentId}`)
    console.log(`  CustomerId: ${b.customerId}`)
    console.log(`  VehicleId: ${b.vehicleId}`)
    console.log(`  WorkshopId: ${b.workshopId}`)
    console.log()
  }
  
  console.log(`Total: ${bookings.length}`)
}

checkTodaysBookings()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
