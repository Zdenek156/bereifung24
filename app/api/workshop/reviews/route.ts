import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWorkshopRequest } from '@/lib/workshop-auth'

// GET /api/workshop/reviews - Get all reviews for the workshop
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateWorkshopRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get all reviews with related data (support both old bookings and direct bookings)
    const reviews = await prisma.review.findMany({
      where: { workshopId: auth.workshopId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
              },
            },
          },
        },
        booking: {
          select: {
            appointmentDate: true,
            tireRequest: {
              select: {
                additionalNotes: true,
              },
            },
          },
        },
        directBooking: {
          select: {
            date: true,
            serviceType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Found ${reviews.length} reviews for workshop ${auth.workshopId}`)

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bewertungen' },
      { status: 500 }
    )
  }
}
