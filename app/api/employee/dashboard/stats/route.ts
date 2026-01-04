import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is B24 Employee
    const employee = await prisma.b24Employee.findFirst({
      where: { email: session.user.email! },
      include: {
        leaveBalance: true,
        documents: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Not a B24 Employee' },
        { status: 403 }
      )
    }

    const currentYear = new Date().getFullYear()

    // Get or create leave balance for current year
    let leaveBalance = employee.leaveBalance?.find(
      (lb: any) => lb.year === currentYear
    )

    if (!leaveBalance) {
      leaveBalance = await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          year: currentYear,
          totalDays: 30,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: 30,
        },
      })
    }

    // Count new documents (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const newDocuments = await prisma.employeeDocument.count({
      where: {
        employeeId: employee.id,
        uploadedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // TODO: Implement pending tasks count
    const pendingTasks = 0

    // TODO: Implement overtime hours
    const overtimeHours = undefined

    return NextResponse.json({
      leaveBalance: leaveBalance
        ? {
            remaining: leaveBalance.remainingDays,
            used: leaveBalance.usedDays,
            total: leaveBalance.totalDays,
          }
        : undefined,
      newDocuments,
      pendingTasks,
      overtimeHours,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
