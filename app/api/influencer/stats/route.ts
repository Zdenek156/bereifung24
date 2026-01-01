import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * GET /api/influencer/stats
 * Get stats for logged-in influencer
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('influencer_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as any
    const influencerId = decoded.influencerId

    // Get influencer with stats
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        clicks: {
          orderBy: { clickedAt: 'desc' },
          take: 100
        },
        conversions: {
          orderBy: { convertedAt: 'desc' },
          take: 50,
          include: {
            customer: { select: { id: true } },
            tireRequest: { select: { id: true, season: true } },
            offer: { select: { id: true, price: true } }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer nicht gefunden' }, { status: 404 })
    }

    // Calculate stats
    const totalClicks = influencer.clicks.length
    const totalConversions = influencer.conversions.length
    
    // Conversion rate
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Calculate earnings
    let totalEarnings = 0
    let unpaidEarnings = 0
    let paidEarnings = 0

    influencer.conversions.forEach(conv => {
      let amount = 0
      
      switch (conv.type) {
        case 'PAGE_VIEW':
          // Assuming 1000 views tracked somehow
          amount = influencer.commissionPer1000Views
          break
        case 'REGISTRATION':
          amount = influencer.commissionPerRegistration
          break
        case 'ACCEPTED_OFFER':
          amount = influencer.commissionPerAcceptedOffer
          break
        case 'WORKSHOP_REGISTRATION':
          amount = influencer.commissionPerRegistration
          break
        case 'WORKSHOP_OFFER':
          amount = influencer.commissionPerAcceptedOffer
          break
      }

      totalEarnings += amount
      
      if (conv.isPaid) {
        paidEarnings += amount
      } else {
        unpaidEarnings += amount
      }
    })

    // Conversions by type
    const conversionsByType = {
      PAGE_VIEW: influencer.conversions.filter(c => c.type === 'PAGE_VIEW').length,
      REGISTRATION: influencer.conversions.filter(c => c.type === 'REGISTRATION').length,
      ACCEPTED_OFFER: influencer.conversions.filter(c => c.type === 'ACCEPTED_OFFER').length,
      WORKSHOP_REGISTRATION: influencer.conversions.filter(c => c.type === 'WORKSHOP_REGISTRATION').length,
      WORKSHOP_OFFER: influencer.conversions.filter(c => c.type === 'WORKSHOP_OFFER').length,
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentClicks = influencer.clicks.filter(c => new Date(c.clickedAt) > thirtyDaysAgo).length
    const recentConversions = influencer.conversions.filter(c => new Date(c.convertedAt) > thirtyDaysAgo).length

    // Stats by month (last 6 months)
    const monthlyStats: any[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = date.getMonth()

      const monthClicks = influencer.clicks.filter(c => {
        const clickDate = new Date(c.clickedAt)
        return clickDate.getFullYear() === year && clickDate.getMonth() === month
      }).length

      const monthConversions = influencer.conversions.filter(c => {
        const convDate = new Date(c.convertedAt)
        return convDate.getFullYear() === year && convDate.getMonth() === month
      })

      const monthEarnings = monthConversions.reduce((sum, conv) => {
        switch (conv.type) {
          case 'PAGE_VIEW': return sum + influencer.commissionPer1000Views
          case 'REGISTRATION': return sum + influencer.commissionPerRegistration
          case 'ACCEPTED_OFFER': return sum + influencer.commissionPerAcceptedOffer
          default: return sum
        }
      }, 0)

      monthlyStats.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
        clicks: monthClicks,
        conversions: monthConversions.length,
        earnings: monthEarnings
      })
    }

    return NextResponse.json({
      stats: {
        totalClicks,
        totalConversions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalEarnings,
        unpaidEarnings,
        paidEarnings,
        conversionsByType,
        recentClicks,
        recentConversions,
        monthlyStats
      },
      recentConversions: influencer.conversions.slice(0, 10).map(conv => ({
        id: conv.id,
        type: conv.type,
        convertedAt: conv.convertedAt,
        isPaid: conv.isPaid,
        amount: conv.type === 'PAGE_VIEW' ? influencer.commissionPer1000Views :
                conv.type === 'REGISTRATION' ? influencer.commissionPerRegistration :
                influencer.commissionPerAcceptedOffer
      })),
      recentPayments: influencer.payments.slice(0, 5).map(pay => ({
        id: pay.id,
        amount: pay.amount,
        status: pay.status,
        createdAt: pay.createdAt,
        paidAt: pay.paidAt
      }))
    })

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 })
    }
    
    console.error('[INFLUENCER] Get stats error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}
