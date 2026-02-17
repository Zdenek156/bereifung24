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
      select: {
        id: true,
        companyName: true,
        description: true,
        website: true,
        stripeEnabled: true,
        taxMode: true,
        user: {
          select: {
            city: true,
            zipCode: true,
            street: true,
            phone: true
          }
        },
        workshopServices: {
          select: {
            id: true,
            serviceType: true,
            basePrice: true,
            durationMinutes: true,
            allowsDirectBooking: true,
            servicePackages: {
              select: {
                id: true,
                packageType: true,
                name: true,
                price: true,
                durationMinutes: true,
                description: true
              },
              where: {
                isActive: true
              }
            }
          },
          where: {
            allowsDirectBooking: true
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
        name: workshop.companyName,
        city: workshop.user.city || null,
        postalCode: workshop.user.zipCode || null,
        street: workshop.user.street || null,
        phone: workshop.user.phone || null,
        rating: avgRating,
        reviewCount: workshop._count.reviews,
        stripeEnabled: workshop.stripeEnabled || false,
        taxMode: workshop.taxMode || 'STANDARD',
        companySettings: {
          description: workshop.description || null,
          website: workshop.website || null
        },
        services: workshop.workshopServices || []
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
