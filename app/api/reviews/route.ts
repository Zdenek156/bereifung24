import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation Schema
const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

// GET /api/reviews - Fetch reviews by workshopId or customerId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workshopId = searchParams.get('workshopId')
    const customerId = searchParams.get('customerId')
    const bookingId = searchParams.get('bookingId')

    // Fetch reviews for a specific workshop
    if (workshopId) {
      const reviews = await prisma.review.findMany({
        where: { workshopId },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          booking: {
            select: {
              appointmentDate: true,
              tireRequest: {
                select: {
                  season: true,
                  width: true,
                  aspectRatio: true,
                  diameter: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Calculate average rating
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      return NextResponse.json({
        reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length
      })
    }

    // Fetch reviews by a specific customer
    if (customerId) {
      const reviews = await prisma.review.findMany({
        where: { customerId },
        include: {
          workshop: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          booking: {
            select: {
              appointmentDate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ reviews })
    }

    // Fetch review for a specific booking
    if (bookingId) {
      const review = await prisma.review.findUnique({
        where: { bookingId },
        include: {
          workshop: {
            include: {
              user: true
            }
          }
        }
      })

      return NextResponse.json({ review })
    }

    return NextResponse.json(
      { error: 'workshopId, customerId oder bookingId erforderlich' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bewertungen' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create or update a review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = reviewSchema.parse(body)

    // Get customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify booking belongs to customer and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { review: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      )
    }

    if (booking.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Check if review already exists
    if (booking.review) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: { id: booking.review.id },
        data: {
          rating: validatedData.rating,
          comment: validatedData.comment || null,
          updatedAt: new Date(),
        }
      })
      return NextResponse.json(updatedReview)
    } else {
      // Create new review
      const newReview = await prisma.review.create({
        data: {
          bookingId: validatedData.bookingId,
          customerId: customer.id,
          workshopId: booking.workshopId,
          rating: validatedData.rating,
          comment: validatedData.comment || null,
        }
      })
      return NextResponse.json(newReview)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Review POST error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Bewertung' },
      { status: 500 }
    )
  }
}
