const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function recalculatePayment() {
  try {
    // Get the pending payment
    const payment = await prisma.affiliatePayment.findFirst({
      where: {
        status: 'PENDING'
      },
      include: {
        influencer: {
          include: {
            conversions: {
              where: { isPaid: false }
            }
          }
        }
      }
    })

    if (!payment) {
      console.log('No pending payment found')
      return
    }

    console.log('Found payment:', payment.id)
    console.log('Old amount:', payment.totalAmount, 'cents')

    const influencer = payment.influencer

    // Recalculate amounts
    let clicksAmount = 0
    let registrationsAmount = 0
    let offersAmount = 0
    let totalClicks = 0
    let totalRegistrations = 0
    let totalOffers = 0

    influencer.conversions.forEach(conv => {
      switch (conv.type) {
        case 'PAGE_VIEW':
          totalClicks++
          break
        case 'REGISTRATION':
          registrationsAmount += influencer.commissionPerRegistration
          totalRegistrations++
          break
        case 'ACCEPTED_OFFER':
          offersAmount += influencer.commissionPerAcceptedOffer
          totalOffers++
          break
        case 'WORKSHOP_REGISTRATION':
          registrationsAmount += influencer.commissionPerWorkshopRegistration
          totalRegistrations++
          break
      }
    })

    // CPM calculation: commission per 1000 views
    clicksAmount = Math.floor((totalClicks / 1000) * influencer.commissionPer1000Views)

    const totalAmount = clicksAmount + registrationsAmount + offersAmount

    console.log('\nRecalculation:')
    console.log('- Total clicks:', totalClicks)
    console.log('- Clicks amount (CPM):', clicksAmount, 'cents = €' + (clicksAmount / 100).toFixed(2))
    console.log('- Total registrations:', totalRegistrations)
    console.log('- Registrations amount:', registrationsAmount, 'cents = €' + (registrationsAmount / 100).toFixed(2))
    console.log('- Total offers:', totalOffers)
    console.log('- Offers amount:', offersAmount, 'cents = €' + (offersAmount / 100).toFixed(2))
    console.log('- NEW TOTAL:', totalAmount, 'cents = €' + (totalAmount / 100).toFixed(2))

    // Update the payment
    const updated = await prisma.affiliatePayment.update({
      where: { id: payment.id },
      data: {
        totalAmount,
        clicksAmount,
        registrationsAmount,
        offersAmount,
        totalClicks,
        totalRegistrations,
        totalOffers
      }
    })

    console.log('\n✅ Payment updated successfully!')
    console.log('New total amount: €' + (updated.totalAmount / 100).toFixed(2))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recalculatePayment()
