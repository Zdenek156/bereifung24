const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAppointments() {
  try {
    // Get all bookings
    const bookings = await prisma.booking.findMany({
      include: {
        workshop: {
          select: {
            companyName: true,
            id: true,
          }
        },
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    })

    console.log(`\n=== Total Bookings: ${bookings.length} ===\n`)

    // Group by workshop
    const byWorkshop = {}
    bookings.forEach(booking => {
      const workshopName = booking.workshop?.companyName || 'Unknown'
      if (!byWorkshop[workshopName]) {
        byWorkshop[workshopName] = []
      }
      byWorkshop[workshopName].push(booking)
    })

    for (const [workshopName, bookings] of Object.entries(byWorkshop)) {
      console.log(`\n${workshopName}:`)
      console.log(`  Total: ${bookings.length}`)
      
      const now = new Date()
      const upcoming = bookings.filter(b => new Date(b.appointmentDate) >= now && b.status === 'CONFIRMED')
      const completed = bookings.filter(b => b.status === 'COMPLETED')
      const cancelled = bookings.filter(b => b.status === 'CANCELLED')
      
      console.log(`  Anstehend (CONFIRMED + future): ${upcoming.length}`)
      console.log(`  Abgeschlossen (COMPLETED): ${completed.length}`)
      console.log(`  Storniert (CANCELLED): ${cancelled.length}`)
      
      console.log('\n  Details:')
      bookings.forEach(b => {
        const date = new Date(b.appointmentDate)
        const isPast = date < now
        console.log(`    - ${b.id.substring(0, 8)}... | Status: ${b.status} | Date: ${date.toLocaleDateString('de-DE')} ${isPast ? '(PAST)' : '(FUTURE)'} | Customer: ${b.customer?.user?.email}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAppointments()
