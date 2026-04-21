import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

/**
 * GET /api/admin/workshop-recommendations
 *
 * Liefert eine schlanke Liste aller Werkstätten (für Auswahl im Mailer)
 * sowie die zuletzt versendeten Empfehlungen (Historie + Engagement-KPIs).
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const include = searchParams.get('include') || 'all' // 'workshops' | 'history' | 'all'

  const result: any = {}

  if (include === 'workshops' || include === 'all') {
    const workshops = await prisma.workshop.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true, city: true } },
        offers: { select: { id: true } },
        reviews: { select: { rating: true } },
        commissions: { select: { orderTotal: true } },
        _count: { select: { recommendations: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    result.workshops = workshops.map(w => {
      const avgRating = w.reviews.length
        ? w.reviews.reduce((s, r) => s + (r.rating || 0), 0) / w.reviews.length
        : null
      const revenue = w.commissions.reduce((s, c) => s + (Number(c.orderTotal) || 0), 0)
      return {
        id: w.id,
        companyName: w.companyName,
        customerNumber: w.customerNumber,
        logoUrl: w.logoUrl,
        email: w.user.email,
        contactName: `${w.user.firstName} ${w.user.lastName}`.trim(),
        city: w.user.city,
        status: w.status,
        isVerified: w.isVerified,
        createdAt: w.createdAt,
        offersCount: w.offers.length,
        reviewsCount: w.reviews.length,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        revenue,
        recommendationsSent: w._count.recommendations,
      }
    })
  }

  if (include === 'history' || include === 'all') {
    const history = await prisma.workshopRecommendation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        workshop: { select: { id: true, companyName: true, logoUrl: true } },
        sentBy: { select: { firstName: true, lastName: true } },
      }
    })
    result.history = history.map(h => ({
      id: h.id,
      workshopId: h.workshopId,
      workshopName: h.workshop.companyName,
      workshopLogo: h.workshop.logoUrl,
      sentByName: h.sentBy ? `${h.sentBy.firstName} ${h.sentBy.lastName}` : (h.sentByName || 'System'),
      subject: h.finalSubject,
      recipientEmail: h.recipientEmail,
      tone: h.tone,
      status: h.status,
      sentAt: h.sentAt,
      openedAt: h.openedAt,
      openCount: h.openCount,
      clickedCtaAt: h.clickedCtaAt,
      clickCount: h.clickCount,
      createdAt: h.createdAt,
    }))
  }

  return NextResponse.json(result)
}
