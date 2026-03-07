import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession, getWorkshopHealth } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/workshops/[id] - Workshop detail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const workshop = await prisma.workshop.findFirst({
    where: { id: params.id, freelancerId: freelancer.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, street: true, zipCode: true, city: true } },
      reviews: { select: { rating: true, comment: true, createdAt: true } },
      workshopServices: { select: { serviceType: true, basePrice: true } },
    },
  })

  if (!workshop) {
    return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
  }

  // Bookings per month (last 6 months)
  const now = new Date()
  const monthlyBookings = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      return prisma.directBooking.count({
        where: {
          workshopId: workshop.id,
          createdAt: { gte: d, lte: end },
          status: { not: 'CANCELLED' },
        }
      }).then(count => ({
        period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('de-DE', { month: 'short' }),
        count,
      }))
    })
  )

  // Profile completeness
  const hasLogo = !!workshop.logoUrl
  const hasDescription = !!workshop.description
  const hasOpeningHours = !!workshop.openingHours
  const hasServices = workshop.workshopServices.length > 0
  const profileItems = [
    { name: 'Logo', complete: hasLogo },
    { name: 'Beschreibung', complete: hasDescription },
    { name: 'Öffnungszeiten', complete: hasOpeningHours },
    { name: 'Services', complete: hasServices },
  ]

  const thisMonthBookings = monthlyBookings[0]?.count || 0
  const isProfileComplete = profileItems.filter(p => p.complete).length >= 3
  const health = getWorkshopHealth(thisMonthBookings, isProfileComplete)

  const avgRating = workshop.reviews.length > 0
    ? Math.round((workshop.reviews.reduce((sum, r) => sum + r.rating, 0) / workshop.reviews.length) * 10) / 10
    : null

  return NextResponse.json({
    id: workshop.id,
    companyName: workshop.companyName,
    status: workshop.status,
    contact: {
      name: `${workshop.user.firstName} ${workshop.user.lastName}`,
      email: workshop.user.email,
      phone: workshop.user.phone,
      address: [workshop.user.street, `${workshop.user.zipCode} ${workshop.user.city}`].filter(Boolean).join(', '),
    },
    health,
    avgRating,
    reviewCount: workshop.reviews.length,
    services: workshop.workshopServices.map((s: any) => ({ name: s.serviceType, price: Number(s.basePrice || 0) })),
    profileItems,
    profileComplete: isProfileComplete,
    monthlyBookings: monthlyBookings.reverse(),
    registeredAt: workshop.createdAt,
    freelancerAcquiredAt: workshop.freelancerAcquiredAt,
  })
}
