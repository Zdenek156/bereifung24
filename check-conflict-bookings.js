const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkConflictingBookings() {
  console.log('\n=== Checking for Conflicting Bookings ===\n')
  
  // Your test reservation details
  const workshopId = 'cml3g7rxd000ckeyn9ypqgg65'
  const dateStr = '2026-02-20' // Tomorrow
  const time = '10:00'
  
  console.log('Checking for conflicts:')
  console.log(`  Workshop: ${workshopId}`)
  console.log(`  Date: ${dateStr}`)
  console.log(`  Time: ${time}\n`)
  
  // Find all bookings for this slot
  const allBookings = await prisma.directBooking.findMany({
    where: {
      workshopId,
      date: new Date(`${dateStr}T00:00:00+01:00`),
      time
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      reservedUntil: true,
      customerId: true,
      totalPrice: true,
      paymentStatus: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log(`Total bookings for this slot: ${allBookings.length}\n`)
  
  if (allBookings.length === 0) {
    console.log('✅ No bookings found - slot is free!')
    return
  }
  
  for (const booking of allBookings) {
    console.log(`\nBooking: ${booking.id}`)
    console.log(`  Status: ${booking.status}`)
    console.log(`  Created: ${booking.createdAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`)
    console.log(`  Payment: ${booking.paymentStatus}`)
    console.log(`  Total: €${booking.totalPrice}`)
    
    if (booking.reservedUntil) {
      const isExpired = booking.reservedUntil < new Date()
      console.log(`  Expires: ${booking.reservedUntil.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`)
      console.log(`  Expired: ${isExpired ? '❌ YES' : '✅ NO'}`)
    }
  }
  
  // Categorize
  const reserved = allBookings.filter(b => b.status === 'RESERVED')
  const confirmed = allBookings.filter(b => b.status === 'CONFIRMED')
  const completed = allBookings.filter(b => b.status === 'COMPLETED')
  const expired = allBookings.filter(b => 
    b.status === 'RESERVED' && b.reservedUntil && b.reservedUntil < new Date()
  )
  
  console.log('\n=== Summary ===\n')
  console.log(`RESERVED: ${reserved.length}`)
  console.log(`CONFIRMED: ${confirmed.length} ⚠️`)
  console.log(`COMPLETED: ${completed.length} ⚠️`)
  console.log(`Expired: ${expired.length}`)
  
  if (confirmed.length > 0 || completed.length > 0) {
    console.log('\n⚠️  PROBLEM FOUND!')
    console.log('There are CONFIRMED or COMPLETED bookings blocking this slot!')
    console.log('These should prevent new bookings (409 Conflict):\n')
    
    ;[...confirmed, ...completed].forEach(b => {
      console.log(`  ${b.id} - Status: ${b.status} - Created: ${b.createdAt.toLocaleString('de-DE')}`)
    })
    
    console.log('\n💡 This explains the 409 Conflict error!')
    console.log('The slot was already booked before.')
  }
  
  if (reserved.length > 1) {
    console.log('\n⚠️  Multiple RESERVED bookings found!')
    console.log('Only one should exist at a time.')
  }
}

checkConflictingBookings()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
