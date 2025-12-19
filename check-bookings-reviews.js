const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        workshop: {
          select: {
            companyName: true
          }
        },
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        review: true
      },
      orderBy: { appointmentDate: 'desc' },
      take: 10
    })

    console.log(`\nFound ${bookings.length} completed bookings:\n`)
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Workshop: ${booking.workshop.companyName}`)
      console.log(`   Customer: ${booking.customer.user.firstName} ${booking.customer.user.lastName}`)
      console.log(`   Date: ${booking.appointmentDate}`)
      console.log(`   Status: ${booking.status}`)
      console.log(`   Has Review: ${booking.review ? 'YES' : 'NO'}`)
      if (booking.review) {
        console.log(`   Rating: ${booking.review.rating}/5`)
      }
      console.log('')
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBookings()
