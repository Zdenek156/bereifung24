const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkReservationConflict() {
  try {
    const reservationId = 'cmltbmd5p0009s59mbcgqf9ae'
    
    // Get the reservation details
    const reservation = await prisma.directBooking.findUnique({
      where: { id: reservationId }
    })
    
    if (!reservation) {
      console.log('❌ Reservation not found!')
      return
    }
    
    console.log('=== RESERVATION DETAILS ===')
    console.log(`ID: ${reservation.id}`)
    console.log(`Workshop: ${reservation.workshopId}`)
    console.log(`Date: ${reservation.date}`)
    console.log(`Time: ${reservation.time}`)
    console.log(`Status: ${reservation.status}`)
    console.log(`Created: ${reservation.createdAt}`)
    
    // Check for conflicting bookings (exact logic from API)
    const conflictingBookings = await prisma.directBooking.findMany({
      where: {
        workshopId: reservation.workshopId,
        date: reservation.date,
        time: reservation.time,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        NOT: { id: reservationId }
      }
    })
    
    console.log('\n=== CONFLICT CHECK ===')
    console.log(`Found ${conflictingBookings.length} conflicting bookings`)
    
    if (conflictingBookings.length > 0) {
      console.log('\n⚠️ CONFLICTS FOUND:')
      conflictingBookings.forEach((booking, idx) => {
        console.log(`\nBooking ${idx + 1}:`)
        console.log(`  ID: ${booking.id}`)
        console.log(`  Status: ${booking.status}`)
        console.log(`  Created: ${booking.createdAt}`)
        console.log(`  Total: €${booking.total}`)
      })
    } else {
      console.log('✅ No conflicts - booking should work!')
    }
    
    // Also check ALL bookings for this slot (including RESERVED)
    const allBookings = await prisma.directBooking.findMany({
      where: {
        workshopId: reservation.workshopId,
        date: reservation.date,
        time: reservation.time
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('\n=== ALL BOOKINGS FOR THIS SLOT ===')
    console.log(`Total: ${allBookings.length}`)
    allBookings.forEach((booking, idx) => {
      console.log(`\n${idx + 1}. ID: ${booking.id}`)
      console.log(`   Status: ${booking.status}`)
      console.log(`   Created: ${booking.createdAt}`)
      console.log(`   Reserved Until: ${booking.reservedUntil || 'N/A'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReservationConflict()
