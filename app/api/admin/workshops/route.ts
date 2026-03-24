import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET all workshops
export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get('sortBy') || 'recent'

    // Basis-Referenzpunkt für Entfernungsberechnung (Bereifung24 Standort: Markgröningen)
    const baseLatitude = 48.9074
    const baseLongitude = 9.0803

    const workshops = await prisma.workshop.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            street: true,
            zipCode: true,
            city: true,
            latitude: true,
            longitude: true
          }
        },
        freelancer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        offers: true,
        commissions: {
          select: {
            orderTotal: true,
            status: true
          }
        },
        workshopServices: {
          where: { isActive: true },
          select: { id: true }
        },
        employees: {
          select: { googleCalendarId: true, googleAccessToken: true }
        },
        landingPage: {
          select: { id: true, isActive: true }
        },
        pricingSettings: {
          select: { id: true }
        },
        suppliers: {
          select: { id: true },
          take: 1
        }
      }
    })

    // Calculate revenue, offers count and distance for each workshop
    const workshopsWithData = workshops.map(workshop => {
      // Revenue from all commissions (PENDING, BILLED, COLLECTED)
      const revenue = workshop.commissions.reduce((sum, commission) => {
        return sum + (Number(commission.orderTotal) || 0)
      }, 0)
      const offersCount = workshop.offers.length

      // Entfernung berechnen
      let distance: number | null = null
      if (workshop.user.latitude && workshop.user.longitude) {
        const R = 6371
        const dLat = (workshop.user.latitude - baseLatitude) * Math.PI / 180
        const dLon = (workshop.user.longitude - baseLongitude) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(baseLatitude * Math.PI / 180) * Math.cos(workshop.user.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = Math.round(R * c)
      }

      // Profile completeness check (6 criteria)
      const workshopCalendarConnected = !!(workshop.googleCalendarId && workshop.googleAccessToken)
      const employeeCalendarConnected = (workshop as any).employees?.some((e: any) => e.googleCalendarId && e.googleAccessToken)
      const hasCalendar = workshopCalendarConnected || employeeCalendarConnected
      const hasStripe = !!workshop.stripeAccountId
      const hasServices = (workshop as any).workshopServices?.length > 0
      const hasPricing = !!(workshop as any).pricingSettings
      const hasSupplier = (workshop as any).suppliers?.length > 0
      const hasLandingPage = !!(workshop as any).landingPage?.isActive
      const hasLandingPageExists = !!(workshop as any).landingPage
      const profileScore = [hasCalendar, hasStripe, hasServices, hasPricing, hasSupplier, hasLandingPage].filter(Boolean).length

      return {
        id: workshop.id,
        customerNumber: workshop.customerNumber,
        companyName: workshop.companyName,
        logoUrl: workshop.logoUrl || null,
        isVerified: workshop.isVerified,
        createdAt: workshop.createdAt,
        distance,
        offersCount,
        revenue,
        profileScore,
        profileDetails: { hasCalendar, hasStripe, hasServices, hasPricing, hasSupplier, hasLandingPage, hasLandingPageExists },
        freelancer: workshop.freelancer ? {
          id: workshop.freelancer.id,
          name: `${workshop.freelancer.user.firstName} ${workshop.freelancer.user.lastName}`
        } : null,
        user: {
          email: workshop.user.email,
          firstName: workshop.user.firstName,
          lastName: workshop.user.lastName,
          phone: workshop.user.phone,
          street: workshop.user.street,
          zipCode: workshop.user.zipCode,
          city: workshop.user.city
        }
      }
    })

    // Sortierung
    let sortedWorkshops = [...workshopsWithData]
    switch (sortBy) {
      case 'recent':
        sortedWorkshops.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case 'distance':
        sortedWorkshops.sort((a, b) => {
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })
        break
      case 'offers':
        sortedWorkshops.sort((a, b) => b.offersCount - a.offersCount)
        break
      case 'revenue':
        sortedWorkshops.sort((a, b) => b.revenue - a.revenue)
        break
    }

    return NextResponse.json(sortedWorkshops)

  } catch (error) {
    console.error('Workshops fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 })
  }
}
