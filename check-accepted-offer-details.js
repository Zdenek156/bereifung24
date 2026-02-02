const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAcceptedOffer() {
  try {
    const offer = await prisma.offer.findFirst({
      where: {
        tireRequestId: 'cmkxbc7np00021ws0v8jjrcvo',
        status: 'ACCEPTED'
      },
      include: {
        workshop: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log('=== ACCEPTED OFFER DETAILS ===')
    console.log('ID:', offer.id)
    console.log('Workshop:', offer.workshop.name)
    console.log('Status:', offer.status)
    console.log('\n--- Legacy Fields ---')
    console.log('tireBrand:', offer.tireBrand)
    console.log('tireModel:', offer.tireModel)
    console.log('price:', offer.price)
    console.log('\n--- New Fields ---')
    console.log('installationFee:', offer.installationFee)
    console.log('selectedTireOptionIds:', JSON.stringify(offer.selectedTireOptionIds))
    console.log('tireOptions:', JSON.stringify(offer.tireOptions, null, 2))
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAcceptedOffer()
