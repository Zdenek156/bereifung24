import { prisma } from '@/lib/prisma'
import NewHomePage from './HomePage'

// Revalidate every 60 seconds — reviews/stats stay fresh without blocking render
export const revalidate = 60

async function getHomePageData() {
  try {
    // Fetch reviews and stats in parallel
    const [allReviews, totalReviews, avgRating, workshopCount, bookingCount] = await Promise.all([
      prisma.review.findMany({
        where: { rating: { gte: 4 } },
        include: {
          workshop: {
            select: {
              companyName: true,
              user: { select: { city: true } }
            }
          },
          customer: {
            select: {
              user: { select: { firstName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.workshop.count({ where: { verifiedAt: { not: null } } }),
      prisma.booking.count()
    ])

    // Deterministic daily shuffle using date as seed (avoids Math.random deopt)
    const daySeed = new Date().toISOString().slice(0, 10).split('-').reduce((a, b) => a + parseInt(b), 0)
    const shuffled = [...allReviews].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) * 31 + daySeed) % 1000
      const hashB = (b.id.charCodeAt(0) * 31 + daySeed) % 1000
      return hashA - hashB
    })
    const reviews = shuffled.slice(0, 15).map(review => {
      const firstName = review.customer?.user?.firstName?.split(' ')[0] || 'Kunde'
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        customerName: firstName,
        workshopName: review.workshop.companyName,
        workshopCity: review.workshop.user.city || null,
        createdAt: review.createdAt.toISOString()
      }
    })

    return {
      reviews,
      stats: {
        totalReviews,
        avgRating: avgRating._avg.rating || 0,
        workshopCount,
        bookingCount
      }
    }
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return {
      reviews: [],
      stats: { totalReviews: 0, avgRating: 0, workshopCount: 0, bookingCount: 0 }
    }
  }
}

export default async function Page() {
  const { reviews, stats } = await getHomePageData()

  return (
    <NewHomePage
      initialReviews={reviews}
      initialStats={stats}
    />
  )
}
