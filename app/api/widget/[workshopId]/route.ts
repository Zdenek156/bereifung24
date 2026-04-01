import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/widget/[workshopId]
 * Public API for workshop widget data (used by embedded widgets)
 * CORS enabled for cross-origin embedding
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workshopId: string } }
) {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.workshopId },
      select: {
        id: true,
        companyName: true,
        logoUrl: true,
        isVerified: true,
        user: {
          select: {
            city: true,
            zipCode: true,
            street: true,
          }
        },
        workshopServices: {
          select: {
            serviceType: true,
            basePrice: true,
            servicePackages: {
              select: {
                packageType: true,
                name: true,
                price: true,
                durationMinutes: true,
                isActive: true,
              },
              where: { isActive: true },
              orderBy: { price: 'asc' },
            },
          },
          where: { isActive: true }
        },
        landingPage: {
          select: {
            slug: true,
            isActive: true,
          }
        },
        _count: {
          select: { reviews: true }
        }
      }
    })

    if (!workshop) {
      return new NextResponse(
        JSON.stringify({ error: 'Workshop not found' }),
        { status: 404, headers: corsHeaders() }
      )
    }

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { workshopId: params.workshopId },
      select: { rating: true }
    })

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0

    // Map service types to German labels
    const serviceLabels: Record<string, string> = {
      'TIRE_CHANGE': 'Reifenwechsel',
      'WHEEL_CHANGE': 'Räderwechsel',
      'TIRE_REPAIR': 'Reifenreparatur',
      'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
      'ALIGNMENT': 'Achsvermessung',
      'ALIGNMENT_BOTH': 'Achsvermessung',
      'CLIMATE_SERVICE': 'Klimaservice',
      'BRAKE_SERVICE': 'Bremsendienst',
      'BATTERY_SERVICE': 'Batterieservice',
      'OTHER_SERVICES': 'Weitere Services',
    }

    // Preferred package type per service — the one we want to show in the widget
    const preferredPackage: Record<string, string> = {
      'TIRE_CHANGE': 'four_tires',      // 4 Reifen wechseln
      'WHEEL_CHANGE': 'basic',           // Basis-Räderwechsel
      'TIRE_REPAIR': 'foreign_object',   // Fremdkörper
      'MOTORCYCLE_TIRE': 'front',        // Vorderrad (pro Reifen)
      'ALIGNMENT_BOTH': 'measurement_both', // Vermessung beide Achsen
      'CLIMATE_SERVICE': 'check',        // Klimacheck
    }

    // Detail text shown next to price
    const detailText: Record<string, Record<string, string>> = {
      'TIRE_CHANGE': { 'four_tires': '4 Reifen', 'two_tires': '2 Reifen' },
      'MOTORCYCLE_TIRE': { 'front': 'pro Reifen', 'rear': 'pro Reifen' },
      'TIRE_REPAIR': { 'foreign_object': 'Fremdkörper' },
      'CLIMATE_SERVICE': { 'check': 'Klimacheck' },
    }

    // Only include services that have active packages
    const services = workshop.workshopServices
      .filter(s => s.servicePackages.length > 0)
      .map(s => {
        // Find preferred package, or fall back to cheapest
        const preferred = preferredPackage[s.serviceType]
        const pkg = (preferred && s.servicePackages.find(p => p.packageType === preferred))
          || s.servicePackages[0] // already sorted by price asc

        const detail = detailText[s.serviceType]?.[pkg.packageType] || ''

        return {
          type: s.serviceType,
          label: serviceLabels[s.serviceType] || s.serviceType,
          price: pkg.price,
          detail, // e.g. "4 Reifen", "Fremdkörper", "pro Reifen"
        }
      })
      .sort((a, b) => {
        const order = ['TIRE_CHANGE', 'WHEEL_CHANGE', 'TIRE_REPAIR', 'MOTORCYCLE_TIRE', 'ALIGNMENT_BOTH', 'ALIGNMENT', 'CLIMATE_SERVICE', 'BRAKE_SERVICE', 'BATTERY_SERVICE', 'OTHER_SERVICES']
        return (order.indexOf(a.type) === -1 ? 99 : order.indexOf(a.type)) - (order.indexOf(b.type) === -1 ? 99 : order.indexOf(b.type))
      })

    // Use landing page URL if available, otherwise fall back to workshop profile
    const hasLandingPage = workshop.landingPage?.isActive && workshop.landingPage?.slug
    const primaryUrl = hasLandingPage
      ? `https://bereifung24.de/lp/${workshop.landingPage!.slug}`
      : `https://bereifung24.de/workshop/${workshop.id}`

    const data = {
      id: workshop.id,
      name: workshop.companyName,
      logo: workshop.logoUrl ? `https://bereifung24.de${workshop.logoUrl}` : null,
      verified: workshop.isVerified,
      city: workshop.user?.city || '',
      zipCode: workshop.user?.zipCode || '',
      street: workshop.user?.street || '',
      rating: avgRating,
      reviewCount: workshop._count.reviews,
      services: services.slice(0, 6), // Max 6 services
      profileUrl: primaryUrl,
      bookingUrl: primaryUrl,
    }

    return new NextResponse(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min browser, 10min CDN
        }
      }
    )
  } catch (error) {
    console.error('Widget API error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders() }
    )
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
