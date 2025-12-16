const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOffer() {
  const offerId = 'cmj7ouq660003klqndmrk654h' // From URL
  
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      tireRequest: {
        include: {
          booking: true
        }
      },
      workshop: true
    }
  })
  
  if (!offer) {
    console.log('Offer not found with ID:', offerId)
    console.log('\nLet me try a similar ID (maybe typo in URL):')
    
    const similarId = 'cmj7ouq660003klgndmrk654h' // Changed klqn to klgn
    const similarOffer = await prisma.offer.findUnique({
      where: { id: similarId },
      include: {
        tireRequest: {
          include: {
            booking: true
          }
        },
        workshop: true
      }
    })
    
    if (similarOffer) {
      console.log('Found offer with similar ID:', similarId)
      console.log({
        offerId: similarOffer.id,
        status: similarOffer.status,
        workshopName: similarOffer.workshop.companyName,
        tireRequestId: similarOffer.tireRequestId,
        hasBooking: !!similarOffer.tireRequest.booking,
        booking: similarOffer.tireRequest.booking
      })
    }
  } else {
    console.log('Offer found!')
    console.log({
      offerId: offer.id,
      status: offer.status,
      workshopName: offer.workshop.companyName,
      tireRequestId: offer.tireRequestId,
      hasBooking: !!offer.tireRequest.booking,
      booking: offer.tireRequest.booking
    })
  }
  
  await prisma.$disconnect()
}

checkOffer().catch(console.error)
