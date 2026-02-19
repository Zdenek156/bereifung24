import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // Prevent static generation

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // B24_EMPLOYEE access is controlled by middleware/PermissionGuard
    // No additional permission check needed here

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
    // Use aggregate for better performance instead of loading all entries
    const revenueAggregate = await prisma.accountingEntry.aggregate({
      where: {
        creditAccount: {
          startsWith: '8'
        }
      },
      _sum: {
        amount: true
      }
    })

    const totalRevenue = revenueAggregate._sum.amount?.toNumber() || 0

    // Calculate total expenses (debit entries on expense accounts 4xxx and 6xxx)
    // Use aggregate for better performance
    const expenseAggregate = await prisma.accountingEntry.aggregate({
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
      _sum: {
        amount: true
      }
    })

    const totalExpenses = expenseAggregate._sum.amount?.toNumber() || 0

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
