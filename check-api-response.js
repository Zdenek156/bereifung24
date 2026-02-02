const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAPIResponse() {
  try {
    // Get the tire request with offer details
    const tireRequest = await prisma.tireRequest.findFirst({
      where: { id: 'cml3jijl0011dllybx2sdyrk7' },
      include: {
        offers: {
          include: {
            workshop: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!tireRequest) {
      console.log('❌ Request not found')
      return
    }

    console.log('✅ Tire Request found')
    console.log('Offers:', tireRequest.offers.length)
    
    tireRequest.offers.forEach((offer, idx) => {
      console.log(`\nOffer ${idx + 1}: ${offer.workshop.companyName}`)
      console.log('  taxMode:', offer.workshop.taxMode || 'UNDEFINED')
      console.log('  Workshop ID:', offer.workshopId)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkAPIResponse()
