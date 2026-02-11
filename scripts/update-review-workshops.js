const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateReviewWorkshops() {
  console.log('🔄 Updating reviews with fake workshops...')

  try {
    // Get all workshops (excluding Luxus24)
    const allWorkshops = await prisma.workshop.findMany({
      where: {
        companyName: {
          not: 'Luxus24'
        }
      },
      include: {
        user: true
      }
    })

    console.log(`Found ${allWorkshops.length} fake workshops`)

    // Get all reviews currently with Luxus24
    const luxus24Workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' }
    })

    if (!luxus24Workshop) {
      console.error('❌ Luxus24 workshop not found')
      return
    }

    const reviewsToUpdate = await prisma.review.findMany({
      where: {
        workshopId: luxus24Workshop.id
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        booking: true
      }
    })

    console.log(`Found ${reviewsToUpdate.length} reviews to update`)

    if (allWorkshops.length === 0) {
      console.error('❌ No fake workshops found. Please create them first.')
      return
    }

    let updated = 0
    for (let i = 0; i < reviewsToUpdate.length; i++) {
      const review = reviewsToUpdate[i]
      const newWorkshop = allWorkshops[i % allWorkshops.length] // Rotate through workshops

      try {
        // Update review
        await prisma.review.update({
          where: { id: review.id },
          data: {
            workshopId: newWorkshop.id
          }
        })

        // Update booking
        if (review.booking) {
          await prisma.booking.update({
            where: { id: review.booking.id },
            data: {
              workshopId: newWorkshop.id
            }
          })

          // Update offer
          await prisma.offer.updateMany({
            where: { id: review.booking.offerId },
            data: {
              workshopId: newWorkshop.id
            }
          })
        }

        updated++
        console.log(`✅ Updated review from ${review.customer.user.firstName} → ${newWorkshop.companyName}`)
      } catch (error) {
        console.error(`❌ Error updating review ${review.id}:`, error.message)
      }
    }

    console.log(`\n✅ Updated ${updated} reviews with different workshops!`)

    // Show stats
    const stats = await prisma.review.groupBy({
      by: ['workshopId'],
      _count: {
        workshopId: true
      }
    })

    console.log(`\n📊 Reviews per workshop:`)
    for (const stat of stats) {
      const workshop = await prisma.workshop.findUnique({
        where: { id: stat.workshopId }
      })
      console.log(`   ${workshop?.companyName}: ${stat._count.workshopId} reviews`)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateReviewWorkshops()
