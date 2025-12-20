// Quick script to check booking statuses
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { appointmentDate: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        workshop: {
          select: {
            companyName: true
          }
        },
        customer: {
          select: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })

    console.log(`\n=== Total Bookings: ${bookings.length} ===\n`)

    const statusCounts = {}
    const now = new Date()

    bookings.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
      
      const date = new Date(b.appointmentDate)
      const isPast = date < now
      const isFuture = date >= now
      
      console.log(`ID: ${b.id.substring(0, 8)}...`)
      console.log(`  Status: ${b.status}`)
      console.log(`  Date: ${date.toISOString().split('T')[0]} ${isPast ? '(PAST)' : '(FUTURE)'}`)
      console.log(`  Workshop: ${b.workshop?.companyName || 'N/A'}`)
      console.log(`  Customer: ${b.customer?.user?.email || 'N/A'}`)
      console.log('')
    })

    console.log('=== Status Summary ===')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error.message)
    await prisma.$disconnect()
  }
}

checkBookings()
