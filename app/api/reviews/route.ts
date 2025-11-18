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
