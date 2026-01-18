// app/api/admin/accounting/reports/euer/route.ts
// Einnahmen-Überschuss-Rechnung (EÜR) - Income-Expense Calculation

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
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
        amount: true,
        description: true,
        bookingDate: true
      }
    })

    // Get account details
    const accountNumbers = new Set<string>()
    entries.forEach(entry => {
      accountNumbers.add(entry.debitAccount)
      accountNumbers.add(entry.creditAccount)
    })

    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        accountNumber: {
          in: Array.from(accountNumbers)
        }
      }
    })

    const accountMap = new Map(
      accounts.map(a => [a.accountNumber, a])
    )

    // Calculate revenue (Einnahmen) - Account class 8xxx (Erlöse)
    const revenue = {
      commission: 0, // 8400 Provisionserlöse
      other: 0,      // 8xxx Sonstige Erlöse
      total: 0
    }

    // Calculate expenses (Ausgaben) - Account classes 4xxx, 6xxx
    const expenses = {
      wages: 0,          // 4120 Löhne und Gehälter
      socialSecurity: 0, // 4130 Sozialabgaben
      commissions: 0,    // 4650 Provisionsaufwand
      travel: 0,         // 4670 Reisekosten
      vehicle: 0,        // 6300 Kfz-Kosten
      rent: 0,           // 4210 Miete
      insurance: 0,      // 4360 Versicherungen
      marketing: 0,      // 4630 Werbekosten
      other: 0,          // Sonstige Betriebsausgaben
      total: 0
    }

    // Process entries
    entries.forEach(entry => {
      const amount = entry.amount.toNumber()
      const debitAccount = accountMap.get(entry.debitAccount)
      const creditAccount = accountMap.get(entry.creditAccount)

      // Revenue (credit side, 8xxx accounts)
      if (entry.creditAccount.startsWith('8')) {
        if (entry.creditAccount === '8400') {
          revenue.commission += amount
        } else {
          revenue.other += amount
        }
        revenue.total += amount
      }

      // Expenses (debit side, 4xxx and 6xxx accounts)
      if (entry.debitAccount.startsWith('4') || entry.debitAccount.startsWith('6')) {
        if (entry.debitAccount === '4120') {
          expenses.wages += amount
        } else if (entry.debitAccount === '4130') {
          expenses.socialSecurity += amount
        } else if (entry.debitAccount === '4650') {
          expenses.commissions += amount
        } else if (entry.debitAccount === '4670') {
          expenses.travel += amount
        } else if (entry.debitAccount.startsWith('63')) {
          expenses.vehicle += amount
        } else if (entry.debitAccount === '4210') {
          expenses.rent += amount
        } else if (entry.debitAccount === '4360') {
          expenses.insurance += amount
        } else if (entry.debitAccount === '4630') {
          expenses.marketing += amount
        } else {
          expenses.other += amount
        }
        expenses.total += amount
      }
    })

    // Calculate profit/loss
    const profitLoss = revenue.total - expenses.total

    return NextResponse.json({
      period: {
        startDate,
        endDate
      },
      revenue,
      expenses,
      profitLoss,
      summary: {
        totalRevenue: revenue.total,
        totalExpenses: expenses.total,
        profit: profitLoss > 0 ? profitLoss : 0,
        loss: profitLoss < 0 ? Math.abs(profitLoss) : 0
      }
    })

  } catch (error) {
    console.error('Error generating EÜR:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
