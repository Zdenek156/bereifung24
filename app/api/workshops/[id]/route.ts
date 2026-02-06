import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workshops/[id]
 * Get public workshop details (for workshop detail page)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      include: {
        companySettings: {
          select: {
            description: true,
            website: true,
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { workshopId: params.id },
      select: { rating: true }
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      success: true,
      workshop: {
        id: workshop.id,
        name: workshop.name,
        city: workshop.city,
        postalCode: workshop.postalCode,
        street: workshop.street,
        phone: workshop.phone,
        rating: avgRating,
        reviewCount: workshop._count.reviews,
        companySettings: workshop.companySettings
      }
    })
  } catch (error) {
    console.error('Error fetching workshop:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Werkstatt' },
      { status: 500 }
    )
  }
}
