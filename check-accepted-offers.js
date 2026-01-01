const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find accepted offers
  const acceptedOffers = await prisma.offer.findMany({
    where: {
      status: 'ACCEPTED'
    },
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
    },
    orderBy: {
      acceptedAt: 'desc'
    },
    take: 5
  })
  
  console.log('\n=== Accepted Offers ===\n')
  for (const offer of acceptedOffers) {
    console.log(`Offer ID: ${offer.id}`)
    console.log(`Customer: ${offer.tireRequest.customer.user.email}`)
    console.log(`Accepted At: ${offer.acceptedAt}`)
    console.log(`Price: €${offer.price / 100}\n`)
  }
  
  // Check if conversions exist for these offers
  for (const offer of acceptedOffers) {
    const conversion = await prisma.affiliateConversion.findFirst({
      where: {
        offerId: offer.id,
        type: 'ACCEPTED_OFFER'
      }
    })
    
    if (!conversion) {
      console.log(`❌ Missing conversion for offer ${offer.id} (${offer.tireRequest.customer.user.email})`)
    } else {
      console.log(`✓ Conversion exists for offer ${offer.id}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
