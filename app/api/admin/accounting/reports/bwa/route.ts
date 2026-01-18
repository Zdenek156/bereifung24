// app/api/admin/accounting/reports/bwa/route.ts
// Betriebswirtschaftliche Auswertung (BWA) - Business Management Evaluation

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
    const compareStartDate = searchParams.get('compareStartDate')
    const compareEndDate = searchParams.get('compareEndDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Get current period data
    const currentPeriod = await calculateBWAPeriod(
      new Date(startDate),
      new Date(endDate)
    )

    // Get comparison period if provided
    let comparisonPeriod = null
    if (compareStartDate && compareEndDate) {
      comparisonPeriod = await calculateBWAPeriod(
        new Date(compareStartDate),
        new Date(compareEndDate)
      )
    }

    return NextResponse.json({
      current: {
        period: { startDate, endDate },
        ...currentPeriod
      },
      comparison: comparisonPeriod ? {
        period: { startDate: compareStartDate, endDate: compareEndDate },
        ...comparisonPeriod
      } : null
    })

  } catch (error) {
    console.error('Error generating BWA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateBWAPeriod(startDate: Date, endDate: Date) {
  const entries = await prisma.accountingEntry.findMany({
    where: {
      bookingDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      debitAccount: true,
      creditAccount: true,
      amount: true,
      sourceType: true
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

  // Initialize BWA structure
  const bwa = {
    revenue: {
      commission: 0,        // 8400 Provisionserlöse
      otherRevenue: 0,      // 8xxx Sonstige Erlöse
      total: 0
    },
    costOfSales: {
      commissionExpense: 0, // 4650 Provisionsaufwand (an Werkstätten)
      total: 0
    },
    grossProfit: 0,
    operatingExpenses: {
      personnel: {
        wages: 0,           // 4120 Löhne und Gehälter
        socialSecurity: 0,  // 4130 Sozialabgaben
        total: 0
      },
      roomCosts: {
        rent: 0,            // 4210 Miete
        utilities: 0,       // 4240 Gas, Strom, Wasser
        total: 0
      },
      vehicle: {
        fuel: 0,            // 6300 Treibstoff
        maintenance: 0,     // 6310 Wartung
        insurance: 0,       // 6320 Kfz-Versicherung
        total: 0
      },
      marketing: 0,         // 4630 Werbekosten
      insurance: 0,         // 4360 Versicherungen
      travel: 0,            // 4670 Reisekosten
      office: 0,            // 6800 Porto, 6805 Telefon
      other: 0,
      total: 0
    },
    operatingResult: 0,
    financialResult: 0,
    earningsBeforeTax: 0,
    taxes: 0,
    netIncome: 0
  }

  // Process entries
  entries.forEach(entry => {
    const amount = entry.amount.toNumber()

    // Revenue (credit side, 8xxx)
    if (entry.creditAccount.startsWith('8')) {
      if (entry.creditAccount === '8400') {
        bwa.revenue.commission += amount
      } else {
        bwa.revenue.otherRevenue += amount
      }
      bwa.revenue.total += amount
    }

    // Expenses (debit side)
    if (entry.debitAccount.startsWith('4') || entry.debitAccount.startsWith('6')) {
      // Cost of sales
      if (entry.debitAccount === '4650') {
        bwa.costOfSales.commissionExpense += amount
        bwa.costOfSales.total += amount
      }
      // Personnel costs
      else if (entry.debitAccount === '4120') {
        bwa.operatingExpenses.personnel.wages += amount
        bwa.operatingExpenses.personnel.total += amount
      } else if (entry.debitAccount === '4130') {
        bwa.operatingExpenses.personnel.socialSecurity += amount
        bwa.operatingExpenses.personnel.total += amount
      }
      // Room costs
      else if (entry.debitAccount === '4210') {
        bwa.operatingExpenses.roomCosts.rent += amount
        bwa.operatingExpenses.roomCosts.total += amount
      } else if (entry.debitAccount === '4240') {
        bwa.operatingExpenses.roomCosts.utilities += amount
        bwa.operatingExpenses.roomCosts.total += amount
      }
      // Vehicle costs
      else if (entry.debitAccount.startsWith('63')) {
        if (entry.debitAccount === '6300') {
          bwa.operatingExpenses.vehicle.fuel += amount
        } else if (entry.debitAccount === '6310') {
          bwa.operatingExpenses.vehicle.maintenance += amount
        } else if (entry.debitAccount === '6320') {
          bwa.operatingExpenses.vehicle.insurance += amount
        }
        bwa.operatingExpenses.vehicle.total += amount
      }
      // Marketing
      else if (entry.debitAccount === '4630') {
        bwa.operatingExpenses.marketing += amount
      }
      // Insurance
      else if (entry.debitAccount === '4360') {
        bwa.operatingExpenses.insurance += amount
      }
      // Travel
      else if (entry.debitAccount === '4670') {
        bwa.operatingExpenses.travel += amount
      }
      // Office
      else if (entry.debitAccount.startsWith('68')) {
        bwa.operatingExpenses.office += amount
      }
      // Other operating expenses
      else {
        bwa.operatingExpenses.other += amount
      }
    }
  })

  // Calculate totals
  bwa.operatingExpenses.total = 
    bwa.operatingExpenses.personnel.total +
    bwa.operatingExpenses.roomCosts.total +
    bwa.operatingExpenses.vehicle.total +
    bwa.operatingExpenses.marketing +
    bwa.operatingExpenses.insurance +
    bwa.operatingExpenses.travel +
    bwa.operatingExpenses.office +
    bwa.operatingExpenses.other

  bwa.grossProfit = bwa.revenue.total - bwa.costOfSales.total
  bwa.operatingResult = bwa.grossProfit - bwa.operatingExpenses.total
  bwa.earningsBeforeTax = bwa.operatingResult + bwa.financialResult
  bwa.netIncome = bwa.earningsBeforeTax - bwa.taxes

  return bwa
}
