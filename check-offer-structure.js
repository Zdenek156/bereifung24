const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOfferStructure() {
  try {
    const offer = await prisma.offer.findFirst({
      include: {
        tireRequest: true,
        booking: true
      }
    })
    console.log('Offer structure:', JSON.stringify(offer, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOfferStructure()
