// app/api/admin/commissions/stats/route.ts
// Admin endpoint to get commission statistics with tax breakdown

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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

    // Build filter
    const where: any = {}
    if (year) where.billingYear = year
    if (month) where.billingMonth = month
    if (workshopId) where.workshopId = workshopId

    // Get all commissions
    const commissions = await prisma.commission.findMany({
      where,
      include: {
        workshop: {
          select: {
            id: true,
            name: true,
            email: true,
            gocardlessMandateStatus: true
          }
        },
        booking: {
          select: {
            id: true,
            serviceType: true,
            bookingDate: true,
            totalPrice: true
          }
        }
      },
      orderBy: [
        { billingYear: 'desc' },
        { billingMonth: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Calculate totals
    const totals = commissions.reduce(
      (acc, comm) => {
        acc.grossAmount += comm.grossAmount || comm.amount
        acc.netAmount += comm.netAmount || 0
        acc.taxAmount += comm.taxAmount || 0
        acc.count += 1

        // Group by status
        if (!acc.byStatus[comm.status]) {
          acc.byStatus[comm.status] = {
            count: 0,
            grossAmount: 0,
            netAmount: 0,
            taxAmount: 0
          }
        }
        acc.byStatus[comm.status].count += 1
        acc.byStatus[comm.status].grossAmount += comm.grossAmount || comm.amount
        acc.byStatus[comm.status].netAmount += comm.netAmount || 0
        acc.byStatus[comm.status].taxAmount += comm.taxAmount || 0

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
    const byWorkshop = commissions.reduce((acc, comm) => {
      const workshopId = comm.workshopId
      if (!acc[workshopId]) {
        acc[workshopId] = {
          workshop: comm.workshop,
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

      acc[workshopId].commissions.push(comm)
      acc[workshopId].totals.count += 1
      acc[workshopId].totals.grossAmount += comm.grossAmount || comm.amount
      acc[workshopId].totals.netAmount += comm.netAmount || 0
      acc[workshopId].totals.taxAmount += comm.taxAmount || 0
      acc[workshopId].totals.totalRevenue += comm.booking?.totalPrice || 0

      return acc
    }, {} as Record<string, any>)

    // Convert to array and sort by total commission
    const workshopStats = Object.values(byWorkshop)
      .sort((a: any, b: any) => b.totals.grossAmount - a.totals.grossAmount)

    // Group by billing period
    const byPeriod = commissions.reduce((acc, comm) => {
      if (!comm.billingYear || !comm.billingMonth) return acc

      const periodKey = `${comm.billingYear}-${comm.billingMonth.toString().padStart(2, '0')}`
      if (!acc[periodKey]) {
        acc[periodKey] = {
          year: comm.billingYear,
          month: comm.billingMonth,
          count: 0,
          grossAmount: 0,
          netAmount: 0,
          taxAmount: 0,
          workshopsCount: new Set()
        }
      }

      acc[periodKey].count += 1
      acc[periodKey].grossAmount += comm.grossAmount || comm.amount
      acc[periodKey].netAmount += comm.netAmount || 0
      acc[periodKey].taxAmount += comm.taxAmount || 0
      acc[periodKey].workshopsCount.add(comm.workshopId)

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
      commissions: commissions.slice(0, 100) // Limit to latest 100 for performance
    })

  } catch (error: any) {
    console.error('Error getting commission stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get commission stats' },
      { status: 500 }
    )
  }
}
