import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/tire-requests/stats
 * Get KPI statistics for tire requests
 * Fixed: Prisma 5.x groupBy _count syntax (FORCE REBUILD)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'month' // day, week, month, year, all

    // Calculate date range based on timeframe
    let startDate: Date | undefined
    const now = new Date()

    switch (timeframe) {
      case 'day':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
      default:
        startDate = undefined
    }

    // Build date filter
    const dateFilter = startDate ? { gte: startDate } : undefined

    // 1. Total Requests
    const totalRequests = await prisma.tireRequest.count({
      where: { createdAt: dateFilter }
    })

    // 2. Open Requests (PENDING, OPEN, QUOTED)
    const openRequests = await prisma.tireRequest.count({
      where: {
        status: { in: ['PENDING', 'OPEN', 'QUOTED'] },
        createdAt: dateFilter
      }
    })

    // 3. Conversion Rate (ACCEPTED / Total)
    const acceptedRequests = await prisma.tireRequest.count({
      where: {
        status: 'ACCEPTED',
        createdAt: dateFilter
      }
    })

    const conversionRate = totalRequests > 0 
      ? Math.round((acceptedRequests / totalRequests) * 100)
      : 0

    // 4. Average Response Time (time from request to first offer)
    const requestsWithOffers = await prisma.tireRequest.findMany({
      where: {
        createdAt: dateFilter,
        offers: {
          some: {}
        }
      },
      select: {
        createdAt: true,
        offers: {
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      }
    })

    let avgResponseTimeHours = 0
    if (requestsWithOffers.length > 0) {
      const totalResponseTime = requestsWithOffers.reduce((sum, req) => {
        if (req.offers.length > 0) {
          const diffMs = req.offers[0].createdAt.getTime() - req.createdAt.getTime()
          return sum + (diffMs / (1000 * 60 * 60)) // Convert to hours
        }
        return sum
      }, 0)
      
      avgResponseTimeHours = Math.round((totalResponseTime / requestsWithOffers.length) * 10) / 10
    }

    // 5. Requests by Status
    const statusCounts = await prisma.tireRequest.groupBy({
      by: ['status'],
      where: { createdAt: dateFilter },
      _count: {
        status: true
      }
    })

    console.log('Status counts:', statusCounts.length)

    const requestsByStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status || 0
      return acc
    }, {} as Record<string, number>)

    // 6. Requests by Service Type
    const tireRequests = await prisma.tireRequest.count({
      where: { createdAt: dateFilter }
    })
    
    // NOTE: These models don't exist in the schema yet - commented out to prevent errors
    // const brakeRequests = await prisma.brakeRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const wheelChangeRequests = await prisma.wheelChangeRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const batteryRequests = await prisma.batteryRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const repairRequests = await prisma.repairRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const alignmentRequests = await prisma.alignmentRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const climateRequests = await prisma.climateRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const motorcycleRequests = await prisma.motorcycleRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    // const otherServiceRequests = await prisma.otherServiceRequest.count({
    //   where: { createdAt: dateFilter }
    // })

    const requestsByType = {
      tires: tireRequests,
      // brakes: 0, // brakeRequests,
      // wheelChange: 0, // wheelChangeRequests,
      // battery: 0, // batteryRequests,
      // repair: 0, // repairRequests,
      // alignment: 0, // alignmentRequests,
      // climate: 0, // climateRequests,
      // motorcycle: 0, // motorcycleRequests,
      // otherService: 0 // otherServiceRequests
    }

    // 7. Top Performing Workshops (by offer count)
    const topWorkshops = await prisma.offer.groupBy({
      by: ['workshopId'],
      where: {
        tireRequest: {
          createdAt: dateFilter
        }
      },
      _count: {
        workshopId: true
      },
      orderBy: {
        _count: {
          workshopId: 'desc'
        }
      },
      take: 5
    })

    const topWorkshopsData = await Promise.all(
      topWorkshops.map(async (item) => {
        const workshop = await prisma.workshop.findUnique({
          where: { id: item.workshopId },
          select: {
            companyName: true,
            user: {
              select: {
                city: true
              }
            }
          }
        })

        return {
          workshopId: item.workshopId,
          workshopName: workshop?.companyName || 'Unknown',
          city: workshop?.user?.city || 'Unknown',
          offerCount: item._count.workshopId || 0
        }
      })
    )

    // 8. Requests without offers (need attention)
    const requestsWithoutOffers = await prisma.tireRequest.count({
      where: {
        status: { in: ['PENDING', 'OPEN'] },
        offers: {
          none: {}
        },
        createdAt: dateFilter
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRequests,
          openRequests,
          conversionRate,
          avgResponseTimeHours
        },
        breakdown: {
          requestsByStatus,
          requestsByType
        },
        insights: {
          topWorkshops: topWorkshopsData,
          requestsWithoutOffers
        },
        timeframe
      }
    })
  } catch (error) {
    console.error('Error fetching tire request stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
