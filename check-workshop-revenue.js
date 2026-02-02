const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRevenue() {
  try {
    console.log('=== Checking Workshop Revenue Data ===\n')
    
    // Get all bookings with their offers and workshops
    const bookings = await prisma.booking.findMany({
      include: {
        offer: {
          select: {
            id: true,
            price: true,
            workshopId: true
          }
        },
        workshop: {
          select: {
            companyName: true,
            customerNumber: true
          }
        }
      },
      take: 20
    })
    
    console.log(`Total bookings found: ${bookings.length}\n`)
    
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`)
      console.log(`  ID: ${booking.id}`)
      console.log(`  Status: ${booking.status}`)
      console.log(`  Workshop: ${booking.workshop?.companyName || 'N/A'}`)
      console.log(`  Offer Price: ${booking.offer?.price || 0} EUR`)
      console.log(`  Created: ${booking.createdAt}`)
      console.log('---')
    })
    
    // Group by status
    const statusCounts = {}
    bookings.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
    })
    
    console.log('\nBookings by Status:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`)
    })
    
    // Calculate revenue by workshop
    console.log('\n=== Revenue by Workshop ===')
    const workshopRevenue = {}
    
    bookings.forEach(booking => {
      if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        const workshopName = booking.workshop?.companyName || 'Unknown'
        const price = booking.offer?.price || 0
        workshopRevenue[workshopName] = (workshopRevenue[workshopName] || 0) + price
      }
    })
    
    Object.entries(workshopRevenue).forEach(([workshop, revenue]) => {
      console.log(`${workshop}: ${revenue.toFixed(2)} EUR`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRevenue()
