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
    console.log('[REVIEW API] Starting review submission')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[REVIEW API] No session found')
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('[REVIEW API] Received data:', body)
    const validatedData = reviewSchema.parse(body)
    console.log('[REVIEW API] Validated data:', validatedData)

    // Get customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })
    console.log('[REVIEW API] Customer found:', customer?.id)

    if (!customer) {
      console.log('[REVIEW API] Customer not found for userId:', session.user.id)
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Try to find booking in BOTH tables (old booking and new direct booking)
    let bookingRecord = null
    let isDirectBooking = false
    let workshopId = null
    let existingReview = null

    // 1. Check old booking table
    const oldBooking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { review: true }
    })

    if (oldBooking) {
      console.log('[REVIEW API] Found old booking:', oldBooking.id, 'customerId:', oldBooking.customerId)
      if (oldBooking.customerId !== customer.id) {
        console.log('[REVIEW API] Permission denied - booking customer:', oldBooking.customerId, 'vs user customer:', customer.id)
        return NextResponse.json(
          { error: 'Keine Berechtigung' },
          { status: 403 }
        )
      }
      bookingRecord = oldBooking
      workshopId = oldBooking.workshopId
      existingReview = oldBooking.review
      isDirectBooking = false
      console.log('[REVIEW API] Using old booking, existing review:', existingReview?.id)
    } else {
      // 2. Check new direct booking table
      console.log('[REVIEW API] Old booking not found, checking direct booking')
      const directBooking = await prisma.directBooking.findUnique({
        where: { id: validatedData.bookingId },
        include: { review: true }
      })
      console.log('[REVIEW API] Direct booking found:', directBooking?.id)

      if (!directBooking) {
        console.log('[REVIEW API] Booking not found in either table:', validatedData.bookingId)
        return NextResponse.json(
          { error: 'Termin nicht gefunden' },
          { status: 404 }
        )
      }

      if (directBooking.customerId !== customer.id) {
        console.log('[REVIEW API] Permission denied - direct booking customer:', directBooking.customerId, 'vs user customer:', customer.id)
        return NextResponse.json(
          { error: 'Keine Berechtigung' },
          { status: 403 }
        )
      }

      bookingRecord = directBooking
      workshopId = directBooking.workshopId
      existingReview = directBooking.review
      isDirectBooking = true
      console.log('[REVIEW API] Using direct booking, existing review:', existingReview?.id)
    }

    // Check if review already exists
    if (existingReview) {
      // Update existing review
      console.log('[REVIEW API] Updating existing review:', existingReview.id)
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: validatedData.rating,
          comment: validatedData.comment || null,
          updatedAt: new Date(),
        }
      })
      console.log('[REVIEW API] Review updated successfully:', updatedReview.id)
      return NextResponse.json(updatedReview)
    } else {
      // Create new review
      console.log('[REVIEW API] Creating new review for', isDirectBooking ? 'direct' : 'old', 'booking')
      const reviewData = {
        ...(isDirectBooking 
          ? { directBookingId: validatedData.bookingId }
          : { bookingId: validatedData.bookingId }
        ),
        customerId: customer.id,
        workshopId: workshopId!,
        rating: validatedData.rating,
        comment: validatedData.comment || null,
      }
      console.log('[REVIEW API] Review data:', reviewData)
      const newReview = await prisma.review.create({
        data: reviewData
      })
      console.log('[REVIEW API] Review created successfully:', newReview.id)
      return NextResponse.json(newReview)
    }
  } catch (error) {
    console.error('[REVIEW API] Error:', error)
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
