const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOldReservations() {
  console.log('\n=== Checking for Stale Reservations ===\n')
  
  const now = new Date()
  console.log('Current Time:', now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }))
  
  // Find all RESERVED bookings
  const reservedBookings = await prisma.directBooking.findMany({
    where: {
      status: 'RESERVED'
    },
    select: {
      id: true,
      createdAt: true,
      reservedUntil: true,
      date: true,
      time: true,
      customerId: true,
      workshopId: true,
      totalPrice: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log(`\nTotal RESERVED bookings: ${reservedBookings.length}\n`)
  
  if (reservedBookings.length === 0) {
    console.log('✅ No RESERVED bookings found - system is clean!')
    return
  }
  
  // Categorize by status
  const active = []
  const expired = []
  
  for (const booking of reservedBookings) {
    const isExpired = booking.reservedUntil && booking.reservedUntil < now
    
    if (isExpired) {
      expired.push(booking)
    } else {
      active.push(booking)
    }
    
    console.log(`\nReservation: ${booking.id}`)
    console.log(`  Created: ${booking.createdAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`)
    console.log(`  Expires: ${booking.reservedUntil ? booking.reservedUntil.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) : 'N/A'}`)
    console.log(`  Appointment: ${booking.date.toLocaleDateString('de-DE')} ${booking.time}`)
    console.log(`  Total: €${booking.totalPrice}`)
    console.log(`  Status: ${isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`)
    
    if (isExpired) {
      const ageMinutes = Math.floor((now - booking.reservedUntil) / 1000 / 60)
      console.log(`  ⚠️  Expired ${ageMinutes} minutes ago!`)
    } else {
      const remainingMinutes = Math.floor((booking.reservedUntil - now) / 1000 / 60)
      console.log(`  ⏰ ${remainingMinutes} minutes remaining`)
    }
  }
  
  console.log('\n=== Summary ===\n')
  console.log(`✅ Active reservations: ${active.length}`)
  console.log(`❌ Expired reservations: ${expired.length}`)
  
  if (expired.length > 0) {
    console.log('\n⚠️  PROBLEM: Expired reservations should have been auto-deleted!')
    console.log('These expired reservations are blocking slots:\n')
    
    expired.forEach(b => {
      console.log(`  ${b.id} - ${b.date.toLocaleDateString('de-DE')} ${b.time}`)
    })
    
    console.log('\n💡 Solution: Delete expired reservations manually')
    console.log('Run: node cleanup-expired-reservations.js')
  } else {
    console.log('\n✅ All reservations are valid (not expired)')
  }
}

checkOldReservations()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
