import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email/email-service'

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

    // Count pending tasks (nur TODO/IN_PROGRESS, ohne REVIEW/BLOCKED)
    const pendingEmployeeTasks = await prisma.employeeTask.count({
      where: {
        assignedToId: employee.id,
        status: {
          in: ['TODO', 'IN_PROGRESS']
        }
      }
    })

    const pendingProspectTasks = await prisma.prospectTask.count({
      where: {
        assignedToId: employee.id,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    })

    const pendingTasks = pendingEmployeeTasks + pendingProspectTasks

    // TODO: Implement overtime hours
    const overtimeHours = undefined

    // Get unread emails count
    let unreadEmails = 0
    try {
      const emailService = new EmailService(session.user.id, true) // true = B24 Employee
      const hasSettings = await emailService.hasSettings()
      
      if (hasSettings) {
        const messages = await emailService.getCachedMessages('INBOX', 100)
        unreadEmails = messages.filter(msg => !msg.isRead).length
      }
    } catch (emailError) {
      console.error('Error fetching email stats:', emailError)
      // Continue without email stats
    }

    // Get total registered customers count
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
      },
    })

    // Get total registered workshops count (all workshops, not just active)
    const totalWorkshops = await prisma.workshop.count()

    // Get collected commissions for the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const commissions = await prisma.commission.findMany({
      where: {
        status: 'COLLECTED',
        collectedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        commissionAmount: true,
      },
    })

    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0)

    // Get count of not-verified workshops (nicht freigeschaltete Werkstätten)
    const notActivatedWorkshops = await prisma.workshop.count({
      where: {
        isVerified: false,
      },
    })

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
      unreadEmails,
      totalCustomers,
      totalWorkshops,
      totalCommissions,
      notActivatedWorkshops,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
