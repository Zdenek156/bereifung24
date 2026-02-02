const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixOfferStatus() {
  try {
    const offerId = 'cmkzqo81x002gq1yefgeqy8t4'
    
    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'ACCEPTED'
      }
    })

    console.log('✅ Offer status reset to ACCEPTED:', offer.status)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixOfferStatus()
