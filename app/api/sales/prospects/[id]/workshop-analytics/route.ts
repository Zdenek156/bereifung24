import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'

/**
 * GET /api/sales/prospects/[id]/workshop-analytics
 *
 * Returns a deeper, real-platform analysis for a Prospect that has already
 * been converted to (or self-registered as) a Workshop on Bereifung24.
 *
 * Identification (in order):
 *   1. prospect.convertedToWorkshopId (manual or automatic conversion)
 *   2. fallback: Workshop whose user.email matches prospect.email
 *      (covers self-registration without manual convert click)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser()
    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        leadScore: true,
        convertedToWorkshopId: true,
        convertedAt: true,
        conversionValue: true
      }
    })

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    // Resolve workshop
    let workshopId = prospect.convertedToWorkshopId
    let matchedBy: 'conversion' | 'email' | null = workshopId ? 'conversion' : null

    if (!workshopId && prospect.email) {
      const byEmail = await prisma.workshop.findFirst({
        where: { user: { email: prospect.email.toLowerCase().trim() } },
        select: { id: true }
      })
      if (byEmail) {
        workshopId = byEmail.id
        matchedBy = 'email'
      }
    }

    if (!workshopId) {
      return NextResponse.json({
        registered: false,
        prospect: {
          name: prospect.name,
          leadScore: prospect.leadScore
        }
      })
    }

    // Load workshop with everything needed for the analysis
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, createdAt: true } },
        _count: {
          select: {
            bookings: true,
            directBookings: true,
            reviews: true,
            workshopServices: true,
            employees: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({
        registered: false,
        prospect: { name: prospect.name, leadScore: prospect.leadScore }
      })
    }

    // Aggregations
    const [
      reviewAgg,
      directBookingAgg,
      bookingAgg,
      completedDirectBookings,
      completedBookings,
      pendingPayouts
    ] = await Promise.all([
      prisma.review.aggregate({
        where: { workshopId },
        _avg: { rating: true },
        _count: { id: true }
      }),
      prisma.directBooking.aggregate({
        where: { workshopId, paymentStatus: 'PAID' as any },
        _sum: { totalPrice: true, platformCommission: true, workshopPayout: true },
        _count: { id: true }
      }),
      prisma.booking.aggregate({
        where: { workshopId, status: 'COMPLETED' },
        _count: { id: true }
      }),
      prisma.directBooking.count({
        where: { workshopId, status: 'COMPLETED' }
      }),
      prisma.booking.count({
        where: { workshopId, status: 'COMPLETED' }
      }),
      prisma.directBooking.aggregate({
        where: { workshopId, paymentStatus: 'PAID' as any, status: { not: 'CANCELLED' } },
        _sum: { workshopPayout: true }
      })
    ])

    // Profile completion score (0-100)
    const profileChecks = [
      !!workshop.logoUrl,
      !!workshop.cardImageUrl,
      !!workshop.description && workshop.description.length > 50,
      !!workshop.website,
      !!workshop.openingHours,
      !!workshop.paymentMethods,
      !!workshop.latitude && !!workshop.longitude,
      !!workshop.stripeEnabled,
      workshop._count.workshopServices > 0,
      workshop._count.employees > 0
    ]
    const profileCompletion = Math.round(
      (profileChecks.filter(Boolean).length / profileChecks.length) * 100
    )

    const daysSinceRegistration = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(workshop.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    )

    const totalRevenue = Number(directBookingAgg._sum.totalPrice ?? 0)
    const totalCommission = Number(directBookingAgg._sum.platformCommission ?? 0)
    const totalPayout = Number(directBookingAgg._sum.workshopPayout ?? 0)
    const totalBookings = workshop._count.bookings + workshop._count.directBookings
    const completedTotal = completedBookings + completedDirectBookings
    const avgRating = reviewAgg._avg.rating ?? null

    // Real-Score (0-100) based on real platform performance
    let realScore = 0
    if (profileCompletion >= 80) realScore += 25
    else if (profileCompletion >= 50) realScore += 15
    else realScore += 5

    if (workshop.status === 'ACTIVE') realScore += 15
    else if (workshop.status === 'PENDING') realScore += 5

    if (workshop.stripeEnabled) realScore += 10
    if (workshop.isVerified) realScore += 10

    if (totalBookings >= 50) realScore += 20
    else if (totalBookings >= 10) realScore += 12
    else if (totalBookings >= 1) realScore += 6

    if (avgRating != null) {
      if (avgRating >= 4.5) realScore += 10
      else if (avgRating >= 4.0) realScore += 6
      else if (avgRating >= 3.0) realScore += 3
    }

    if (workshop._count.reviews >= 20) realScore += 10
    else if (workshop._count.reviews >= 5) realScore += 5

    realScore = Math.min(100, realScore)

    return NextResponse.json({
      registered: true,
      matchedBy,
      workshop: {
        id: workshop.id,
        companyName: workshop.companyName,
        customerNumber: workshop.customerNumber,
        email: workshop.user.email,
        contact: `${workshop.user.firstName ?? ''} ${workshop.user.lastName ?? ''}`.trim(),
        status: workshop.status,
        approved: workshop.approved,
        isVerified: workshop.isVerified,
        stripeEnabled: workshop.stripeEnabled,
        createdAt: workshop.createdAt,
        daysSinceRegistration
      },
      profile: {
        completionPercent: profileCompletion,
        hasLogo: !!workshop.logoUrl,
        hasCardImage: !!workshop.cardImageUrl,
        hasDescription: !!workshop.description && workshop.description.length > 50,
        hasWebsite: !!workshop.website,
        hasOpeningHours: !!workshop.openingHours,
        hasPaymentMethods: !!workshop.paymentMethods,
        hasLocation: !!workshop.latitude && !!workshop.longitude,
        servicesCount: workshop._count.workshopServices,
        employeesCount: workshop._count.employees
      },
      activity: {
        totalBookings,
        directBookings: workshop._count.directBookings,
        legacyBookings: workshop._count.bookings,
        completedBookings: completedTotal,
        cancellationRate:
          totalBookings > 0
            ? Math.round(((totalBookings - completedTotal) / totalBookings) * 100)
            : 0,
        reviewsCount: workshop._count.reviews,
        averageRating: avgRating != null ? Number(avgRating.toFixed(2)) : null
      },
      finance: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformCommission: Math.round(totalCommission * 100) / 100,
        workshopPayout: Math.round(totalPayout * 100) / 100,
        pendingPayout: Math.round(Number(pendingPayouts._sum.workshopPayout ?? 0) * 100) / 100,
        avgRevenuePerBooking:
          directBookingAgg._count.id > 0
            ? Math.round((totalRevenue / directBookingAgg._count.id) * 100) / 100
            : 0
      },
      score: {
        realScore,
        originalLeadScore: prospect.leadScore ?? 0,
        delta: realScore - (prospect.leadScore ?? 0)
      },
      conversion: {
        convertedAt: prospect.convertedAt,
        conversionValue: prospect.conversionValue
      }
    })
  } catch (error: any) {
    console.error('Error loading workshop analytics:', error)
    return NextResponse.json(
      { error: 'Failed to load workshop analytics', details: error.message },
      { status: 500 }
    )
  }
}
