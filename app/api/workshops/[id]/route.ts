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
        logoUrl: true,
        cardImageUrl: true,
        stripeEnabled: true,
        taxMode: true,
        latitude: true,
        longitude: true,
        user: {
          select: {
            city: true,
            zipCode: true,
            street: true,
            phone: true
          }
        },
        landingPage: {
          select: {
            heroImage: true,
            isActive: true
          }
        },
        workshopServices: {
          select: {
            id: true,
            serviceType: true,
            basePrice: true,
            basePrice4: true,
            durationMinutes: true,
            durationMinutes4: true,
            balancingMinutes: true,
            balancingPrice: true,
            storagePrice: true,
            washingPrice: true,
            mountingOnlySurcharge: true,
            disposalFee: true,
            runFlatSurcharge: true,
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
            isActive: true
          }
        },
        tireChangePricing: {
          where: {
            isActive: true
          },
          select: {
            rimSize: true,
            pricePerTire: true,
            durationPerTire: true
          },
          orderBy: {
            rimSize: 'asc'
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
        logoUrl: workshop.logoUrl || null,
        cardImageUrl: workshop.cardImageUrl || null,
        heroImage: workshop.landingPage?.isActive ? (workshop.landingPage?.heroImage || null) : null,
        city: workshop.user.city || null,
        zipCode: workshop.user.zipCode || null,
        street: workshop.user.street || null,
        phone: workshop.user.phone || null,
        latitude: workshop.latitude || null,
        longitude: workshop.longitude || null,
        averageRating: avgRating,
        reviewCount: workshop._count.reviews,
        stripeEnabled: workshop.stripeEnabled || false,
        taxMode: workshop.taxMode || 'STANDARD',
        description: workshop.description || null,
        companySettings: {
          description: workshop.description || null,
          website: workshop.website || null
        },
        // Flat pricing for mobile app
        pricing: (() => {
          const wheelChange = workshop.workshopServices.find(s => s.serviceType === 'WHEEL_CHANGE')
          const tireChange = workshop.workshopServices.find(s => s.serviceType === 'TIRE_CHANGE')
          const mainService = wheelChange || tireChange
          // Find lowest tire change price for PKW (rim 15-18)
          const pkwPricing = workshop.tireChangePricing.find(p => p.rimSize >= 15 && p.rimSize <= 18)
          const tireChangePricePKW = pkwPricing ? pkwPricing.pricePerTire * 4 : null
          return {
            basePrice: mainService?.basePrice || null,
            basePrice4: mainService?.basePrice4 || null,
            tireChangePricePKW: tireChangePricePKW,
            balancingPrice: mainService?.balancingPrice || null,
            storagePrice: mainService?.storagePrice || null,
            washingPrice: mainService?.washingPrice || null,
            durationMinutes: mainService?.durationMinutes || null,
            durationMinutes4: mainService?.durationMinutes4 || null,
            balancingMinutes: mainService?.balancingMinutes || null,
          }
        })(),
        services: workshop.workshopServices || [],
        tireChangePricing: workshop.tireChangePricing || []
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
