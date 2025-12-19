import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/reviews - Get all reviews for the workshop
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get workshop ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get all reviews with related data
    const reviews = await prisma.review.findMany({
      where: { workshopId: user.workshop.id },
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
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Found ${reviews.length} reviews for workshop ${user.workshop.id}`)

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
