const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const offerId = 'cmjvm3gs7000c280xcajtg3t2'
  
  // Get offer details
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      tireRequest: {
        include: {
          customer: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })
  
  if (!offer) {
    console.log('Offer not found')
    return
  }
  
  console.log(`Creating ACCEPTED_OFFER conversion for:`)
  console.log(`- Customer: ${offer.tireRequest.customer.user.email}`)
  console.log(`- Offer: ${offer.id}`)
  console.log(`- Accepted At: ${offer.acceptedAt}`)
  
  // Find influencer and cookie
  const cookieId = 'tp1v7ifgwsmjvd4j45' // From earlier debug
  const influencerCode = 'TURBOGA53'
  
  const influencer = await prisma.influencer.findUnique({
    where: { code: influencerCode },
    select: {
      id: true,
      commissionPerCustomerFirstOffer: true
    }
  })
  
  if (!influencer) {
    console.log('Influencer not found')
    return
  }
  
  console.log(`- Influencer: ${influencerCode}`)
  console.log(`- Commission: €${influencer.commissionPerCustomerFirstOffer / 100}`)
  
  // Create conversion
  const conversion = await prisma.affiliateConversion.create({
    data: {
      influencerId: influencer.id,
      cookieId: cookieId,
      customerId: offer.tireRequest.customerId,
      type: 'ACCEPTED_OFFER',
      tireRequestId: offer.tireRequestId,
      offerId: offer.id,
      commissionAmount: influencer.commissionPerCustomerFirstOffer,
      isPaid: false
    }
  })
  
  console.log(`\n✅ Conversion created: ${conversion.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
