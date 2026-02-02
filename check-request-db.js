const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRequest() {
  try {
    const request = await prisma.tireRequest.findUnique({
      where: { id: 'cml3jujll0011dlybx2sdyrk7' },
      include: {
        offers: {
          include: {
            workshop: true
          }
        }
      }
    })

    if (!request) {
      console.log('❌ REQUEST NOT FOUND IN DATABASE')
      process.exit(1)
    }

    console.log('✅ REQUEST EXISTS:')
    console.log('  ID:', request.id)
    console.log('  Status:', request.status)
    console.log('  Customer ID:', request.customerId)
    console.log('  Season:', request.season)
    console.log('  Offers Count:', request.offers.length)
    
    const acceptedOffer = request.offers.find(o => o.status === 'ACCEPTED')
    console.log('\n📋 OFFERS:')
    request.offers.forEach((offer, i) => {
      console.log(`  Offer ${i + 1}:`)
      console.log(`    ID: ${offer.id}`)
      console.log(`    Status: ${offer.status}`)
      console.log(`    Workshop: ${offer.workshop.companyName}`)
      console.log(`    Price: ${offer.price}`)
    })

    if (acceptedOffer) {
      console.log('\n✅ ACCEPTED OFFER FOUND:')
      console.log('  Offer ID:', acceptedOffer.id)
      console.log('  Workshop:', acceptedOffer.workshop.companyName)
      console.log('  Workshop ID:', acceptedOffer.workshopId)
    } else {
      console.log('\n⚠️ NO ACCEPTED OFFER')
    }

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkRequest()
