import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get employee with assigned workshops
    const employee = await prisma.b24Employee.findUnique({
      where: { id: params.id },
      include: {
        assignedWorkshops: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get workshop IDs
    const workshopIds = employee.assignedWorkshops.map(w => w.id)

    // Get commissions for assigned workshops
    const commissions = await prisma.commission.findMany({
      where: {
        workshopId: { in: workshopIds },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate statistics
    const totalCommissions = commissions.length
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
    const paidAmount = commissions
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amount, 0)
    const pendingAmount = commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amount, 0)

    // Group by workshop
    const byWorkshop = workshopIds.map(workshopId => {
      const workshopCommissions = commissions.filter(c => c.workshopId === workshopId)
      const workshop = employee.assignedWorkshops.find(w => w.id === workshopId)
      
      return {
        workshopId,
        workshopName: workshop?.companyName || 'Unknown',
        totalCommissions: workshopCommissions.length,
        totalAmount: workshopCommissions.reduce((sum, c) => sum + c.amount, 0),
        paidAmount: workshopCommissions
          .filter(c => c.status === 'PAID')
          .reduce((sum, c) => sum + c.amount, 0),
        pendingAmount: workshopCommissions
          .filter(c => c.status === 'PENDING')
          .reduce((sum, c) => sum + c.amount, 0)
      }
    }).filter(item => item.totalCommissions > 0)

    // Group by month
    const byMonth: { [key: string]: { count: number; amount: number; paidAmount: number } } = {}
    commissions.forEach(c => {
      const monthKey = new Date(c.createdAt).toISOString().substring(0, 7) // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { count: 0, amount: 0, paidAmount: 0 }
      }
      byMonth[monthKey].count++
      byMonth[monthKey].amount += c.amount
      if (c.status === 'PAID') {
        byMonth[monthKey].paidAmount += c.amount
      }
    })

    // Get recent bookings from assigned workshops
    const recentBookings = await prisma.booking.findMany({
      where: {
        workshopId: { in: workshopIds },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        department: employee.department
      },
      workshops: {
        total: employee.assignedWorkshops.length,
        active: employee.assignedWorkshops.filter(w => w.isActive).length,
        verified: employee.assignedWorkshops.filter(w => w.isVerified).length,
        list: employee.assignedWorkshops
      },
      commissions: {
        total: totalCommissions,
        totalAmount,
        paidAmount,
        pendingAmount,
        byWorkshop,
        byMonth: Object.entries(byMonth).map(([month, data]) => ({
          month,
          ...data
        })).sort((a, b) => b.month.localeCompare(a.month))
      },
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        appointmentDate: b.appointmentDate,
        status: b.status,
        workshopName: b.workshop.companyName,
        createdAt: b.createdAt
      }))
    })

  } catch (error) {
    console.error('Employee analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
