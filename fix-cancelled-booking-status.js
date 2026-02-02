const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCancelledBooking() {
  try {
    const bookingId = 'cmkzqrs6o002nq1ye0anc5uf9' // The cancelled booking
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tireRequest: true,
        offer: true,
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!booking) {
      console.log('❌ Booking not found')
      return
    }

    console.log('Found booking:')
    console.log(`- ID: ${booking.id}`)
    console.log(`- Customer: ${booking.customer?.user?.firstName} ${booking.customer?.user?.lastName}`)
    console.log(`- Status: ${booking.status}`)
    console.log(`- TireRequest ID: ${booking.tireRequestId}`)
    console.log(`- TireRequest Status: ${booking.tireRequest?.status}`)
    console.log(`- Offer ID: ${booking.offerId}`)
    console.log(`- Offer Status: ${booking.offer?.status}`)
    console.log('')

    if (booking.status === 'CANCELLED') {
      // Reset TireRequest to QUOTED
      if (booking.tireRequest && booking.tireRequest.status === 'ACCEPTED') {
        await prisma.tireRequest.update({
          where: { id: booking.tireRequestId },
          data: {
            status: 'QUOTED'
          }
        })
        console.log('✅ Reset TireRequest status: ACCEPTED → QUOTED')
      }

      // Reset Offer to PENDING
      if (booking.offer && booking.offer.status === 'ACCEPTED') {
        await prisma.offer.update({
          where: { id: booking.offerId },
          data: {
            status: 'PENDING'
          }
        })
        console.log('✅ Reset Offer status: ACCEPTED → PENDING')
      }

      console.log('\n✅ Done! Customer can now rebook.')
    } else {
      console.log('⚠️  Booking is not CANCELLED, no changes made')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCancelledBooking()
