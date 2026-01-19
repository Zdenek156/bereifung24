import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasApplication } from '@/lib/applications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow ADMIN and B24_EMPLOYEE with hr application
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    // Check application access for B24_EMPLOYEE
    if (session.user.role === 'B24_EMPLOYEE') {
      const hasAccess = await hasApplication(session.user.id, 'hr')
      if (!hasAccess) {
        return NextResponse.json({ error: 'No access to HR application' }, { status: 403 })
      }
    }

    // Get total employees (exclude admins and system users)
    const totalEmployees = await prisma.b24Employee.count({
      where: {
        AND: [
          { email: { not: { contains: 'admin@bereifung24.de' } } },
          { email: { not: { contains: 'system@' } } }
        ]
      }
    })

    // Get active employees (those with active contracts, exclude admins and system)
    const activeEmployees = await prisma.b24Employee.count({
      where: {
        AND: [
          { email: { not: { contains: 'admin@bereifung24.de' } } },
          { email: { not: { contains: 'system@' } } },
          {
            OR: [
              { contractEnd: null },
              { contractEnd: { gte: new Date() } }
            ]
          }
        ]
      }
    })

    // Get pending approvals (Phase 3 - skip if table doesn't exist)
    let pendingApprovals = 0
    try {
      pendingApprovals = await prisma.approvalWorkflow.count({
        where: {
          status: 'PENDING'
        }
      })
    } catch (error) {
      // Table doesn't exist yet (Phase 3)
      console.log('ApprovalWorkflow table not available yet')
    }

    // Get pending payrolls (Phase 3 - skip if table doesn't exist)
    let pendingPayrolls = 0
    try {
      pendingPayrolls = await prisma.payroll.count({
        where: {
          status: {
            in: ['DRAFT', 'REVIEW']
          }
        }
      })
    } catch (error) {
      // Table doesn't exist yet (Phase 3)
      console.log('Payroll table not available yet')
    }

    // Calculate monthly payroll total (Phase 3 - skip if table doesn't exist)
    let monthlyPayrollTotal = 0
    try {
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

      monthlyPayrollTotal = payrolls.reduce(
        (sum, payroll) => sum + Number(payroll.totalEmployerCosts || 0),
        0
      )
    } catch (error) {
      // Table doesn't exist yet (Phase 3)
      console.log('Payroll table not available yet')
    }

    // Get open job postings (Phase 3 - skip if table doesn't exist)
    let openJobPostings = 0
    try {
      openJobPostings = await prisma.jobPosting.count({
        where: {
          isActive: true
        }
      })
    } catch (error) {
      // Table doesn't exist yet (Phase 3)
      console.log('JobPosting table not available yet')
    }

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
