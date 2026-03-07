import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession, getWorkshopHealth } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/workshops - List all freelancer's workshops
export async function GET(request: NextRequest) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const search = request.nextUrl.searchParams.get('search') || ''
  const statusFilter = request.nextUrl.searchParams.get('status') || ''
  const sort = request.nextUrl.searchParams.get('sort') || 'createdAt'
  const order = request.nextUrl.searchParams.get('order') || 'desc'

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const where: any = { freelancerId: freelancer.id }
  if (search) {
    where.companyName = { contains: search, mode: 'insensitive' }
  }
  if (statusFilter) {
    where.status = statusFilter
  }

  const workshops = await prisma.workshop.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      reviews: { select: { rating: true } },
      workshopServices: { where: { isActive: true }, select: { serviceType: true } },
      landingPage: { select: { isActive: true } },
      pricingSettings: { select: { id: true } },
      employees: { select: { googleCalendarId: true, googleAccessToken: true } },
      suppliers: { where: { isActive: true }, select: { id: true }, take: 1 },
      _count: {
        select: {
          directBookings: { where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } } },
        }
      },
    },
    orderBy: { [sort]: order },
  })

  // Get last month bookings for comparison
  const workshopIds = workshops.map(w => w.id)
  const lastMonthBookings = workshopIds.length > 0 ? await prisma.directBooking.groupBy({
    by: ['workshopId'],
    where: {
      workshopId: { in: workshopIds },
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      status: { not: 'CANCELLED' },
    },
    _count: true,
  }) : []

  const lastMonthMap = new Map(lastMonthBookings.map(b => [b.workshopId, b._count]))

  // Get commissions for current period
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const commissions = await prisma.freelancerCommission.groupBy({
    by: ['workshopId'],
    where: { freelancerId: freelancer.id, period: currentPeriod },
    _sum: { freelancerAmount: true },
  })
  const commissionMap = new Map(commissions.map(c => [c.workshopId, Number(c._sum.freelancerAmount || 0)]))

  const result = workshops.map(ws => {
    const bookingsThisMonth = ws._count.directBookings
    const bookingsLastMonthCount = lastMonthMap.get(ws.id) || 0
    const avgRating = ws.reviews.length > 0
      ? Math.round((ws.reviews.reduce((sum, r) => sum + r.rating, 0) / ws.reviews.length) * 10) / 10
      : null

    // Profile completeness check (6 criteria matching Werkstatt-Einrichtung widget)
    const workshopCalendarConnected = !!(ws.googleCalendarId && ws.googleAccessToken)
    const employeeCalendarConnected = ws.employees.some((e: any) => e.googleCalendarId && e.googleAccessToken)
    const hasCalendar = workshopCalendarConnected || employeeCalendarConnected
    const hasStripe = !!ws.stripeAccountId
    const hasServices = ws.workshopServices.length > 0
    const hasPricing = !!ws.pricingSettings
    const hasSupplier = ws.suppliers.length > 0
    const hasLandingPage = !!(ws.landingPage?.isActive)
    const profileScore = [hasCalendar, hasStripe, hasServices, hasPricing, hasSupplier, hasLandingPage].filter(Boolean).length
    const isProfileComplete = profileScore >= 5

    const health = getWorkshopHealth(bookingsThisMonth, isProfileComplete)

    let bookingTrend: 'up' | 'down' | 'stable' = 'stable'
    if (bookingsThisMonth > bookingsLastMonthCount) bookingTrend = 'up'
    else if (bookingsThisMonth < bookingsLastMonthCount) bookingTrend = 'down'

    return {
      id: ws.id,
      companyName: ws.companyName,
      status: ws.status,
      contactName: `${ws.user.firstName} ${ws.user.lastName}`,
      contactEmail: ws.user.email,
      contactPhone: ws.user.phone,
      bookingsThisMonth,
      bookingsLastMonth: bookingsLastMonthCount,
      bookingTrend,
      commissionThisMonth: commissionMap.get(ws.id) || 0,
      avgRating,
      reviewCount: ws.reviews.length,
      profileScore,
      profileComplete: isProfileComplete,
      profileDetails: { hasCalendar, hasStripe, hasServices, hasPricing, hasSupplier, hasLandingPage },
      health,
      services: ws.workshopServices.map(s => s.serviceType),
      registeredAt: ws.createdAt,
      freelancerAcquiredAt: ws.freelancerAcquiredAt,
    }
  })

  // Sort by health: red first, then yellow, then green
  result.sort((a, b) => {
    const healthOrder = { red: 0, yellow: 1, green: 2 }
    return healthOrder[a.health.status] - healthOrder[b.health.status]
  })

  return NextResponse.json({ workshops: result, total: result.length })
}
