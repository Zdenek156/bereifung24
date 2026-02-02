const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRequest() {
  try {
    console.log('🔍 Checking Request: cml3jujll0011dlybx2sdyrk7\n')
    
    const request = await prisma.tireRequest.findUnique({
      where: { id: 'cml3jujll0011dlybx2sdyrk7' },
      include: {
        offers: {
          include: {
            workshop: {
              include: {
                user: true
              }
            }
          }
        },
        customer: {
          include: {
            user: true
          }
        }
      }
    })
    
    if (!request) {
      console.log('❌ Request NOT FOUND!')
      return
    }
    
    console.log('✅ Request found:')
    console.log('   ID:', request.id)
    console.log('   Status:', request.status)
    console.log('   Season:', request.season)
    console.log('   Customer:', request.customer.user.email)
    console.log('   Created:', request.createdAt)
    console.log('')
    
    console.log('📋 Offers:', request.offers.length)
    request.offers.forEach((offer, index) => {
      console.log(`\n   Offer ${index + 1}:`)
      console.log('   - ID:', offer.id)
      console.log('   - Workshop:', offer.workshop.companyName)
      console.log('   - Status:', offer.status)
      console.log('   - Price:', offer.price)
      console.log('   - Valid until:', offer.validUntil)
      console.log('   - Workshop calendarMode:', offer.workshop.calendarMode)
      console.log('   - Workshop googleCalendarId:', offer.workshop.googleCalendarId)
    })
    
    // Check if any accepted offer
    const acceptedOffer = request.offers.find(o => o.status === 'ACCEPTED')
    if (acceptedOffer) {
      console.log('\n✅ ACCEPTED OFFER:', acceptedOffer.id)
      console.log('   Workshop:', acceptedOffer.workshop.companyName)
    } else {
      console.log('\n⚠️ No accepted offer yet')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRequest()
