// app/api/admin/commissions/stats/route.ts
// Admin endpoint to get commission statistics with tax breakdown

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if admin
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
    const workshopId = searchParams.get('workshopId')

    // Build filter for DirectBookings
    const where: any = {
      platformCommission: { not: null },
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    }
    
    if (workshopId) {
      where.workshopId = workshopId
    }
    
    if (year && month) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      where.paidAt = {
        gte: startDate,
        lte: endDate
      }
    } else if (year) {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59)
      where.paidAt = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get all DirectBookings with commissions
    const directBookings = await prisma.directBooking.findMany({
      where,
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            stripeAccountId: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate totals
    const totals = directBookings.reduce(
      (acc, booking) => {
        const grossAmount = Number(booking.platformCommission || 0)
        const netAmount = Number(booking.platformNetCommission || 0)
        const taxAmount = grossAmount - netAmount
        
        acc.grossAmount += grossAmount
        acc.netAmount += netAmount
        acc.taxAmount += taxAmount
        acc.count += 1

        // Group by payment status
        const status = booking.paymentStatus === 'PAID' ? 'COLLECTED' : booking.paymentStatus
        if (!acc.byStatus[status]) {
          acc.byStatus[status] = {
            count: 0,
            grossAmount: 0,
            netAmount: 0,
            taxAmount: 0
          }
        }
        acc.byStatus[status].count += 1
        acc.byStatus[status].grossAmount += grossAmount
        acc.byStatus[status].netAmount += netAmount
        acc.byStatus[status].taxAmount += taxAmount

        return acc
      },
      {
        count: 0,
        grossAmount: 0,
        netAmount: 0,
        taxAmount: 0,
        byStatus: {} as Record<string, any>
      }
    )

    // Group by workshop
    const byWorkshop = directBookings.reduce((acc, booking) => {
      const wId = booking.workshopId
      if (!acc[wId]) {
        acc[wId] = {
          workshop: booking.workshop,
          commissions: [],
          totals: {
            count: 0,
            grossAmount: 0,
            netAmount: 0,
            taxAmount: 0,
            totalRevenue: 0
          }
        }
      }

      acc[wId].commissions.push(booking)
      acc[wId].totals.count += 1
      acc[wId].totals.grossAmount += Number(booking.platformCommission || 0)
      acc[wId].totals.netAmount += Number(booking.platformNetCommission || 0)
      acc[wId].totals.taxAmount += Number(booking.platformCommission || 0) - Number(booking.platformNetCommission || 0)
      acc[wId].totals.totalRevenue += Number(booking.totalPrice || 0)

      return acc
    }, {} as Record<string, any>)

    // Convert to array and sort by total commission
    const workshopStats = Object.values(byWorkshop)
      .sort((a: any, b: any) => b.totals.grossAmount - a.totals.grossAmount)

    // Group by billing period (based on paidAt)
    const byPeriod = directBookings.reduce((acc, booking) => {
      if (!booking.paidAt) return acc

      const paidDate = new Date(booking.paidAt)
      const billingYear = paidDate.getFullYear()
      const billingMonth = paidDate.getMonth() + 1

      const periodKey = `${billingYear}-${billingMonth.toString().padStart(2, '0')}`
      if (!acc[periodKey]) {
        acc[periodKey] = {
          year: billingYear,
          month: billingMonth,
          count: 0,
          grossAmount: 0,
          netAmount: 0,
          taxAmount: 0,
          workshopsCount: new Set()
        }
      }

      acc[periodKey].count += 1
      acc[periodKey].grossAmount += Number(booking.platformCommission || 0)
      acc[periodKey].netAmount += Number(booking.platformNetCommission || 0)
      acc[periodKey].taxAmount += Number(booking.platformCommission || 0) - Number(booking.platformNetCommission || 0)
      acc[periodKey].workshopsCount.add(booking.workshopId)

      return acc
    }, {} as Record<string, any>)

    // Convert sets to counts
    const periodStats = Object.entries(byPeriod)
      .map(([period, data]: [string, any]) => ({
        period,
        ...data,
        workshopsCount: data.workshopsCount.size
      }))
      .sort((a, b) => b.period.localeCompare(a.period))

    return NextResponse.json({
      success: true,
      totals: {
        count: totals.count,
        grossAmount: Math.round(totals.grossAmount * 100) / 100,
        netAmount: Math.round(totals.netAmount * 100) / 100,
        taxAmount: Math.round(totals.taxAmount * 100) / 100,
        byStatus: totals.byStatus
      },
      byWorkshop: workshopStats,
      byPeriod: periodStats,
      commissions: directBookings.slice(0, 100) // Limit to latest 100 for performance
    })

  } catch (error: any) {
    console.error('Error getting commission stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get commission stats' },
      { status: 500 }
    )
  }
}
