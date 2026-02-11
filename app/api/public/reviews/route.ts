import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/reviews - Get latest reviews for homepage
 * Returns the most recent reviews with workshop info
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '3')

    // Get ALL reviews with rating >= 4 first
    const allReviews = await prisma.review.findMany({
      where: {
        rating: {
          gte: 4 // Only show 4-5 star reviews on homepage
        }
      },
      include: {
        workshop: {
          select: {
            companyName: true,
            user: {
              select: {
                city: true
              }
            }
          }
        },
        customer: {
          select: {
            user: {
              select: {
                firstName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Shuffle reviews for rotation - different reviews each time
    const shuffled = [...allReviews].sort(() => Math.random() - 0.5)
    const reviews = shuffled.slice(0, limit)

    // Calculate stats
    const totalReviews = await prisma.review.count()
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true
      }
    })
    const workshopCount = await prisma.workshop.count({
      where: {
        verifiedAt: {
          not: null
        }
      }
    })
    const bookingCount = await prisma.booking.count()

    return NextResponse.json({
      success: true,
      reviews: reviews.map(review => {
        // Extract only first name (split by space and take first part)
        const firstName = review.customer.user.firstName?.split(' ')[0] || 'Kunde'
        
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          customerName: firstName, // Only first name for privacy
          workshopName: review.workshop.companyName,
          workshopCity: review.workshop.user.city || null,
          createdAt: review.createdAt
        }
      }),
      stats: {
        totalReviews,
        avgRating: avgRating._avg.rating || 0,
        workshopCount,
        bookingCount
      }
    })
  } catch (error) {
    console.error('Error fetching public reviews:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reviews',
        reviews: [],
        stats: {
          totalReviews: 0,
          avgRating: 0,
          workshopCount: 0,
          bookingCount: 0
        }
      },
      { status: 500 }
    )
  }
}
