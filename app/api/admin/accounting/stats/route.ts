import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission for B24_EMPLOYEE
    if (session.user.role === 'B24_EMPLOYEE') {
      if (!session.user.b24EmployeeId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const permission = await prisma.b24EmployeePermission.findFirst({
        where: {
          employeeId: session.user.b24EmployeeId,
          resource: 'buchhaltung',
          canRead: true
        }
      })

      if (!permission) {
        return NextResponse.json(
          { error: 'No permission for accounting' },
          { status: 403 }
        )
      }
    }

    // Get total account count
    const accountCount = await prisma.chartOfAccounts.count()

    // Get total entry count
    const entryCount = await prisma.accountingEntry.count()

    // Get last entry date
    const lastEntry = await prisma.accountingEntry.findFirst({
      orderBy: { bookingDate: 'desc' },
      select: { bookingDate: true }
    })

    // Calculate total revenue (credit entries on revenue accounts 8xxx)
    const revenueEntries = await prisma.accountingEntry.findMany({
      where: {
        creditAccount: {
          startsWith: '8'
        }
      },
      select: {
        amount: true
      }
    })

    const totalRevenue = revenueEntries.reduce((sum, entry) => sum + entry.amount.toNumber(), 0)

    // Calculate total expenses (debit entries on expense accounts 4xxx and 6xxx)
    const expenseEntries = await prisma.accountingEntry.findMany({
      where: {
        OR: [
          {
            debitAccount: {
              startsWith: '4'
            }
          },
          {
            debitAccount: {
              startsWith: '6'
            }
          }
        ]
      },
      select: {
        amount: true
      }
    })

    const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount.toNumber(), 0)

    const totalProfit = totalRevenue - totalExpenses

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      totalProfit,
      entryCount,
      accountCount,
      lastEntryDate: lastEntry?.bookingDate?.toISOString() || null
    })
  } catch (error) {
    console.error('Error fetching accounting stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
