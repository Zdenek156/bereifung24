import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/influencers/stats
 * Get aggregate statistics for all influencers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })
    
    if (!employee || employee.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Total influencers
    const totalInfluencers = await prisma.influencer.count()
    const activeInfluencers = await prisma.influencer.count({
      where: { isActive: true }
    })
    
    // Total clicks
    const totalClicks = await prisma.affiliateClick.count()
    
    // Total conversions by type
    const conversionsByType = await prisma.affiliateConversion.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })
    
    // Total unpaid commissions
    const unpaidCommissions = await prisma.affiliateConversion.aggregate({
      where: { isPaid: false },
      _sum: {
        commissionAmount: true
      }
    })
    
    // Total paid commissions
    const paidCommissions = await prisma.affiliatePayment.aggregate({
      where: { status: 'PAID' },
      _sum: {
        totalAmount: true
      }
    })
    
    // Top 5 performers by total conversions
    const allInfluencers = await prisma.influencer.findMany({
      select: {
        id: true,
        code: true,
        email: true,
        channelName: true,
        platform: true
      }
    })
    
    const influencersWithCounts = await Promise.all(
      allInfluencers.map(async (inf) => {
        const conversions = await prisma.affiliateConversion.count({
          where: { influencerId: inf.id }
        })
        return { ...inf, conversions }
      })
    )
    
    const topPerformers = influencersWithCounts
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5)
    
    // Recent conversions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentConversions = await prisma.affiliateConversion.count({
      where: {
        convertedAt: {
          gte: sevenDaysAgo
        }
      }
    })
    
    // Conversion rate
    const conversionRate = totalClicks > 0 
      ? ((conversionsByType.reduce((sum, c) => sum + c._count.id, 0) / totalClicks) * 100).toFixed(2)
      : '0.00'
    
    return NextResponse.json({
      totalInfluencers,
      activeInfluencers,
      totalClicks,
      conversionsByType: conversionsByType.reduce((acc, c) => {
        acc[c.type] = c._count.id
        return acc
      }, {} as Record<string, number>),
      unpaidCommissions: unpaidCommissions._sum.commissionAmount || 0,
      paidCommissions: paidCommissions._sum.totalAmount || 0,
      topPerformers: topPerformers.map(p => ({
        id: p.id,
        code: p.code,
        email: p.email,
        channelName: p.channelName,
        platform: p.platform,
        conversions: p.conversions
      })),
      recentConversions,
      conversionRate: parseFloat(conversionRate)
    })
    
  } catch (error) {
    console.error('[ADMIN] Get influencer stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
