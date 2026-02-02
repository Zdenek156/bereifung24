const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCancelledBooking() {
  try {
    // Get recent cancelled bookings
    const cancelledBookings = await prisma.booking.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        workshop: {
          select: {
            companyName: true
          }
        },
        tireRequest: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    })

    console.log(`\n=== Cancelled Bookings (Last 24h): ${cancelledBookings.length} ===\n`)

    if (cancelledBookings.length === 0) {
      console.log('No cancelled bookings in last 24 hours')
      
      // Check all recent bookings
      const recentBookings = await prisma.booking.findMany({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 3 * 60 * 60 * 1000) // Last 3 hours
          }
        },
        include: {
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
          workshop: {
            select: {
              companyName: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10
      })

      console.log(`\nRecent bookings (last 3h): ${recentBookings.length}`)
      for (const booking of recentBookings) {
        console.log(`- ${booking.id}`)
        console.log(`  Status: ${booking.status}`)
        console.log(`  Customer: ${booking.customer?.user?.firstName} ${booking.customer?.user?.lastName}`)
        console.log(`  Workshop: ${booking.workshop?.companyName}`)
        console.log(`  Appointment: ${booking.appointmentDate} ${booking.appointmentTime}`)
        console.log(`  Updated: ${booking.updatedAt}`)
        console.log('')
      }
      
      return
    }

    for (const booking of cancelledBookings) {
      console.log(`Booking ID: ${booking.id}`)
      console.log(`Customer: ${booking.customer?.user?.firstName} ${booking.customer?.user?.lastName} (${booking.customer?.user?.email})`)
      console.log(`Workshop: ${booking.workshop?.companyName}`)
      console.log(`Status: ${booking.status}`)
      console.log(`TireRequest ID: ${booking.tireRequestId}`)
      console.log(`TireRequest Status: ${booking.tireRequest?.status}`)
      console.log(`Appointment Date: ${booking.appointmentDate}`)
      console.log(`Appointment Time: ${booking.appointmentTime}`)
      console.log(`Duration: ${booking.estimatedDuration}min`)
      console.log(`Employee ID: ${booking.employeeId || 'NONE'}`)
      console.log(`Google Event ID: ${booking.googleEventId || 'NONE'}`)
      console.log(`Cancelled at: ${booking.updatedAt}`)
      console.log('---\n')

      // Check if there are any other bookings at the same time
      const sameTimeBookings = await prisma.booking.findMany({
        where: {
          workshopId: booking.workshopId,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        }
      })

      console.log(`Other bookings at same time (${booking.appointmentDate} ${booking.appointmentTime}): ${sameTimeBookings.length}`)
      if (sameTimeBookings.length > 0) {
        sameTimeBookings.forEach(b => {
          console.log(`  - Booking ${b.id} (${b.status})`)
        })
      }
      console.log('')

      // Check the tire request status
      const tireRequest = await prisma.tireRequest.findUnique({
        where: {
          id: booking.tireRequestId
        },
        select: {
          id: true,
          status: true,
          offers: {
            select: {
              id: true,
              workshopId: true,
              status: true
            }
          }
        }
      })

      console.log(`TireRequest ${tireRequest.id}:`)
      console.log(`  Status: ${tireRequest.status}`)
      console.log(`  Offers: ${tireRequest.offers.length}`)
      tireRequest.offers.forEach(offer => {
        console.log(`    - Offer ${offer.id} (${offer.status})`)
      })
      console.log('\n')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCancelledBooking()
