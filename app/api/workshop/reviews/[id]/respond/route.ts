import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWorkshopRequest } from '@/lib/workshop-auth'

// POST /api/workshop/reviews/[id]/respond - Respond to a review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateWorkshopRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { response } = await request.json()

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Antwort darf nicht leer sein' },
        { status: 400 }
      )
    }

    // Verify that this review belongs to this workshop
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Bewertung nicht gefunden' },
        { status: 404 }
      )
    }

    if (review.workshopId !== auth.workshopId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Update the review with the workshop response
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        workshopResponse: response,
        respondedAt: new Date(),
      },
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error('Review response error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Antwort' },
      { status: 500 }
    )
  }
}
