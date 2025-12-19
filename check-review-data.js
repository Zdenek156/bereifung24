const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkReviewData() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                city: true
              }
            }
          }
        },
        booking: {
          include: {
            tireRequest: true,
            offer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Reviews data:', JSON.stringify(reviews, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReviewData()
