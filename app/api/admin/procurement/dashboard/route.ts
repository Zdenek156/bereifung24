import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has procurement read permission
    if (session.user.role !== 'ADMIN') {
      const permissionCheck = await requirePermission('procurement', 'read')
      if (permissionCheck) return permissionCheck
    }

    // Get current year
    const currentYear = new Date().getFullYear()

    // Count open requests by status
    const pendingRequests = await prisma.procurementRequest.count({
      where: { status: 'PENDING' }
    })

    const approvedRequests = await prisma.procurementRequest.count({
      where: { status: 'APPROVED' }
    })

    // Count orders by status
    const activeOrders = await prisma.purchaseOrder.count({
      where: {
        status: {
          in: ['SENT', 'CONFIRMED', 'PARTIALLY_DELIVERED']
        }
      }
    })

    const deliveredOrders = await prisma.purchaseOrder.count({
      where: {
        status: 'DELIVERED',
        invoiceReceived: false
      }
    })

    // Get budget info for current year
    const investmentPlan = await prisma.investmentPlan.findUnique({
      where: { year: currentYear },
      include: {
        budgets: true
      }
    })

    // Get recent requests
    const recentRequests = await prisma.procurementRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      }
    })

    // Get recent orders
    const recentOrders = await prisma.purchaseOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        orderedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Calculate spending by cost center (current year)
    const spendingByCostCenter = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: new Date(currentYear, 0, 1)
        },
        status: {
          in: ['DELIVERED', 'INVOICED', 'PAID']
        }
      },
      _sum: {
        totalGross: true
      }
    })

    const totalSpent = spendingByCostCenter.reduce(
      (sum, item) => sum + (item._sum.totalGross || 0),
      0
    )

    return NextResponse.json({
      stats: {
        pendingRequests,
        approvedRequests,
        activeOrders,
        deliveredOrders,
        totalSpent,
        budget: investmentPlan?.totalBudget || 0,
        budgetUsed: ((totalSpent / (investmentPlan?.totalBudget || 1)) * 100).toFixed(1)
      },
      recentRequests,
      recentOrders,
      budgetByCostCenter: investmentPlan?.budgets || []
    })
  } catch (error) {
    console.error('Error fetching procurement dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
