const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupOldTestBooking() {
  console.log('\n=== Cleaning Up Old Test Booking ===\n')
  
  const bookingId = 'cmlrzklym000k14hmjribath2'
  
  // Fetch booking details
  const booking = await prisma.directBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      date: true,
      time: true,
      totalPrice: true,
      paymentStatus: true,
      workshopId: true,
      customerId: true
    }
  })
  
  if (!booking) {
    console.log('❌ Booking not found!')
    return
  }
  
  console.log('Found booking:')
  console.log(`  ID: ${booking.id}`)
  console.log(`  Status: ${booking.status}`)
  console.log(`  Created: ${booking.createdAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`)
  console.log(`  Appointment: ${booking.date.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })} ${booking.time}`)
  console.log(`  Total: €${booking.totalPrice}`)
  console.log(`  Payment: ${booking.paymentStatus}`)
  
  // Delete the booking
  console.log('\n🗑️  Deleting old test booking...')
  
  await prisma.directBooking.delete({
    where: { id: bookingId }
  })
  
  console.log('✅ Booking deleted successfully!')
  console.log('\nSlot is now free for new bookings.')
}

cleanupOldTestBooking()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
