const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupOldReserved() {
  // Find RESERVED bookings older than 10 minutes with no payment
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  
  const oldReserved = await prisma.directBooking.findMany({
    where: {
      status: 'RESERVED',
      paymentId: null,
      createdAt: {
        lt: tenMinutesAgo
      }
    }
  })
  
  console.log(`\n=== Cleanup Old RESERVED Bookings ===\n`)
  console.log(`Found ${oldReserved.length} old RESERVED bookings (>10 min without payment)\n`)
  
  if (oldReserved.length > 0) {
    for (const booking of oldReserved) {
      console.log(`Cancelling: ${booking.id}`)
      console.log(`  Created: ${booking.createdAt.toLocaleString('de-DE')}`)
      console.log(`  Appointment: ${booking.date.toLocaleDateString('de-DE')} ${booking.time}`)
      
      await prisma.directBooking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED'
        }
      })
      
      console.log(`  ✅ Cancelled\n`)
    }
    
    console.log(`\n✅ Cleanup complete: ${oldReserved.length} bookings cancelled`)
  } else {
    console.log('✅ No old RESERVED bookings to cleanup')
  }
}

cleanupOldReserved()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
