const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLatestAccepted() {
  // Use the IDs we found earlier
  const requestIds = ['cmj7uzdix00017n57qv1hz2k4', 'cmj7otgl00001klgn0mfyh8uz']
  
  for (const reqId of requestIds) {
    const request = await prisma.tireRequest.findUnique({
      where: { id: reqId },
      include: {
        offers: {
          where: {
            status: 'ACCEPTED'
          },
          include: {
            workshop: true
          }
        },
        booking: true
      }
    })
    
    if (!request) {
      console.log(`Request ${reqId} not found`)
      continue
    }
    
    console.log(`\n=== Request ${reqId} ===`)
    console.log({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      hasBooking: !!request.booking,
      booking: request.booking ? {
        id: request.booking.id,
        status: request.booking.status,
        appointmentDate: request.booking.appointmentDate
      } : null,
      acceptedOffers: request.offers.length
    })
    
    if (request.offers.length > 0) {
      console.log('Accepted Offer:')
      console.log({
        offerId: request.offers[0].id,
        workshopName: request.offers[0].workshop.companyName,
        totalPrice: request.offers[0].totalPrice
      })
    }
  }
  
  await prisma.$disconnect()
}

checkLatestAccepted().catch(console.error)
