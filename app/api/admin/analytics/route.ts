import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/analytics - Get page view statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d' // 24h, 7d, 30d, 90d, year, all
    const page = searchParams.get('page') || null // Filter by specific page

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2020-01-01') // Beginning of time for this app
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Build where clause
    const whereClause: any = {
      viewedAt: {
        gte: startDate,
      },
    }

    if (page) {
      whereClause.path = page
    }

    // Get total page views
    const totalViews = await prisma.pageView.count({
      where: whereClause,
    })

    // Get unique visitors (by IP)
    const uniqueVisitors = await prisma.pageView.findMany({
      where: whereClause,
      select: {
        ipAddress: true,
      },
      distinct: ['ipAddress'],
    })

    // Get views by page
    const viewsByPage = await prisma.pageView.groupBy({
      by: ['path'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 20, // Top 20 pages
    })

    // Get views by day (for chart)
    const viewsByDay = await prisma.$queryRaw<Array<{date: Date, count: bigint}>>`
      SELECT DATE("viewedAt") as date, COUNT(*) as count
      FROM page_views
      WHERE "viewedAt" >= ${startDate}
      GROUP BY DATE("viewedAt")
      ORDER BY date ASC
    `

    // Get workshop landing page views
    const workshopViews = await prisma.pageView.groupBy({
      by: ['workshopId'],
      where: {
        ...whereClause,
        workshopId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Get workshop names for landing page views
    const workshopIds = workshopViews.map(v => v.workshopId).filter(Boolean) as string[]
    const workshops = await prisma.workshop.findMany({
      where: {
        id: {
          in: workshopIds,
        },
      },
      select: {
        id: true,
        companyName: true,
      },
    })

    const workshopViewsWithNames = workshopViews.map(v => ({
      workshopId: v.workshopId,
      workshopName: workshops.find(w => w.id === v.workshopId)?.companyName || 'Unbekannt',
      count: v._count.id,
    }))

    // Get referrer statistics
    const topReferrers = await prisma.pageView.groupBy({
      by: ['referrer'],
      where: {
        ...whereClause,
        referrer: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    return NextResponse.json({
      timeRange,
      startDate,
      endDate: now,
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      viewsByPage: viewsByPage.map(v => ({
        path: v.path,
        count: v._count.id,
      })),
      viewsByDay: viewsByDay.map(v => ({
        date: v.date,
        count: Number(v.count),
      })),
      workshopViews: workshopViewsWithNames,
      topReferrers: topReferrers.map(r => ({
        referrer: r.referrer,
        count: r._count.id,
      })),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    )
  }
}
