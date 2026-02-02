const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugRequest() {
  const requestId = 'cml3jujll0011dlybx2sdyrk7'
  const customerId = 'cml3jmzte000kdlybn0aqsi6i' // Anton Michl CUSTOMER ID (not user ID)
  
  try {
    // Simulate the exact API call from the frontend
    const request = await prisma.tireRequest.findFirst({
      where: {
        id: requestId,
        customerId: customerId
      },
      include: {
        offers: {
          include: {
            workshop: {
              include: {
                user: true
              }
            },
            tireOptions: {
              orderBy: {
                pricePerTire: 'asc'
              }
            }
          },
          orderBy: {
            price: 'asc'
          }
        }
      }
    })

    if (!request) {
      console.log('❌ REQUEST NOT FOUND FOR THIS CUSTOMER')
      process.exit(1)
    }

    console.log('✅ REQUEST FOUND:')
    console.log('  Request ID:', request.id)
    console.log('  Offers Count:', request.offers.length)
    console.log('')

    const acceptedOffer = request.offers.find(o => o.status === 'ACCEPTED')
    
    if (acceptedOffer) {
      console.log('✅ ACCEPTED OFFER:')
      console.log('  Offer ID:', acceptedOffer.id)
      console.log('  Workshop:', acceptedOffer.workshop.companyName)
      console.log('  Status:', acceptedOffer.status)
      console.log('  Calendar Mode:', acceptedOffer.workshop.calendarMode)
      console.log('')
      console.log('🔗 BOOK LINK SHOULD BE:')
      console.log(`  /dashboard/customer/requests/${requestId}/book?offerId=${acceptedOffer.id}`)
      console.log('')
      
      // Check what frontend receives (after transformation)
      const transformedOffer = {
        ...acceptedOffer,
        workshop: {
          companyName: acceptedOffer.workshop.companyName,
          logoUrl: acceptedOffer.workshop.logoUrl,
          taxMode: acceptedOffer.workshop.taxMode,
          calendarMode: acceptedOffer.workshop.calendarMode,
          street: acceptedOffer.workshop.user.street,
          zipCode: acceptedOffer.workshop.user.zipCode,
          city: acceptedOffer.workshop.user.city,
          phone: acceptedOffer.workshop.user.phone
        }
      }
      
      console.log('📦 TRANSFORMED OFFER (what API returns):')
      console.log(JSON.stringify(transformedOffer.workshop, null, 2))
    } else {
      console.log('❌ NO ACCEPTED OFFER FOUND')
      console.log('Available offers:')
      request.offers.forEach((o, i) => {
        console.log(`  ${i + 1}. ID: ${o.id}, Status: ${o.status}, Workshop: ${o.workshop.companyName}`)
      })
    }

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

debugRequest()
