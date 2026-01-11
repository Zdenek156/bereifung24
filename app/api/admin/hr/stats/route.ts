import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get total employees
    const totalEmployees = await prisma.b24Employee.count()

    // Get active employees (those with active contracts)
    const activeEmployees = await prisma.b24Employee.count({
      where: {
        OR: [
          { contractEnd: null },
          { contractEnd: { gte: new Date() } }
        ]
      }
    })

    // Get pending approvals
    const pendingApprovals = await prisma.approvalWorkflow.count({
      where: {
        status: 'PENDING'
      }
    })

    // Get pending payrolls (DRAFT or REVIEW)
    const pendingPayrolls = await prisma.payroll.count({
      where: {
        status: {
          in: ['DRAFT', 'REVIEW']
        }
      }
    })

    // Calculate monthly payroll total (current month)
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const payrolls = await prisma.payroll.findMany({
      where: {
        month: currentMonth,
        year: currentYear
      },
      select: {
        totalEmployerCosts: true
      }
    })

    const monthlyPayrollTotal = payrolls.reduce(
      (sum, payroll) => sum + Number(payroll.totalEmployerCosts || 0),
      0
    )

    // Get open job postings
    const openJobPostings = await prisma.jobPosting.count({
      where: {
        isActive: true
      }
    })

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      pendingApprovals,
      pendingPayrolls,
      monthlyPayrollTotal,
      openJobPostings
    })
  } catch (error) {
    console.error('Error fetching HR stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch HR stats' },
      { status: 500 }
    )
  }
}
