const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkReviews() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true
          }
        },
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`\nFound ${reviews.length} reviews:\n`)
    reviews.forEach((review, index) => {
      console.log(`${index + 1}. Workshop: ${review.workshop.companyName}`)
      console.log(`   Customer: ${review.customer.user.firstName} ${review.customer.user.lastName}`)
      console.log(`   Rating: ${review.rating}/5`)
      console.log(`   Comment: ${review.comment || 'None'}`)
      console.log(`   Created: ${review.createdAt}`)
      console.log(`   Workshop ID: ${review.workshopId}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReviews()
