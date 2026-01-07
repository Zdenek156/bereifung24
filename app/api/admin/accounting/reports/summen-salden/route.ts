// app/api/admin/accounting/reports/summen-salden/route.ts
// Summen- und Saldenliste

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Get all active accounts
    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        accountNumber: 'asc'
      }
    })

    // Get all entries in the period
    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      select: {
        debitAccount: true,
        creditAccount: true,
        amount: true
      }
    })

    // Calculate account balances
    const accountBalances = new Map<string, {
      accountNumber: string
      accountName: string
      accountType: string
      debitTotal: number    // Soll-Summe
      creditTotal: number   // Haben-Summe
      balance: number       // Saldo
      debitBalance: number  // Soll-Saldo
      creditBalance: number // Haben-Saldo
    }>()

    // Initialize all accounts
    accounts.forEach(account => {
      accountBalances.set(account.accountNumber, {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        debitTotal: 0,
        creditTotal: 0,
        balance: 0,
        debitBalance: 0,
        creditBalance: 0
      })
    })

    // Process entries
    entries.forEach(entry => {
      const amount = entry.amount.toNumber()

      // Debit side
      const debitAccount = accountBalances.get(entry.debitAccount)
      if (debitAccount) {
        debitAccount.debitTotal += amount
      }

      // Credit side
      const creditAccount = accountBalances.get(entry.creditAccount)
      if (creditAccount) {
        creditAccount.creditTotal += amount
      }
    })

    // Calculate balances
    accountBalances.forEach(account => {
      const diff = account.debitTotal - account.creditTotal
      account.balance = diff
      
      if (diff > 0) {
        account.debitBalance = diff
        account.creditBalance = 0
      } else if (diff < 0) {
        account.debitBalance = 0
        account.creditBalance = Math.abs(diff)
      } else {
        account.debitBalance = 0
        account.creditBalance = 0
      }
    })

    // Filter out accounts with no activity
    const activeAccounts = Array.from(accountBalances.values())
      .filter(acc => acc.debitTotal > 0 || acc.creditTotal > 0)

    // Calculate totals
    const totals = {
      debitTotal: 0,
      creditTotal: 0,
      debitBalance: 0,
      creditBalance: 0
    }

    activeAccounts.forEach(acc => {
      totals.debitTotal += acc.debitTotal
      totals.creditTotal += acc.creditTotal
      totals.debitBalance += acc.debitBalance
      totals.creditBalance += acc.creditBalance
    })

    return NextResponse.json({
      period: {
        startDate,
        endDate
      },
      accounts: activeAccounts,
      totals
    })

  } catch (error) {
    console.error('Error generating Summen- und Saldenliste:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
