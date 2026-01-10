import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/income-statement/comparison
 * Compare income statements between two years
 * Query params: year (current year)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const yearParam = searchParams.get('year')

    if (!yearParam) {
      return NextResponse.json(
        { success: false, error: 'Year parameter is required' },
        { status: 400 }
      )
    }

    const currentYear = parseInt(yearParam)
    const previousYear = currentYear - 1

    // Fetch both years
    const [current, previous] = await Promise.all([
      prisma.IncomeStatement.findFirst({
        where: { year: currentYear },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.IncomeStatement.findFirst({
        where: { year: previousYear },
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (!current) {
      return NextResponse.json(
        { success: false, error: `No income statement found for year ${currentYear}` },
        { status: 404 }
      )
    }

    // Calculate changes
    const calculateChange = (currentVal: number | null, previousVal: number | null) => {
      if (currentVal === null || previousVal === null || previousVal === 0) {
        return { absolute: 0, percentage: 0 }
      }
      const absolute = currentVal - previousVal
      const percentage = (absolute / Math.abs(previousVal)) * 100
      return { absolute, percentage }
    }

    const comparison = {
      current,
      previous,
      changes: previous ? {
        salesRevenue: calculateChange(current.salesRevenue, previous.salesRevenue),
        inventoryChange: calculateChange(current.inventoryChange, previous.inventoryChange),
        ownWorkCapitalized: calculateChange(current.ownWorkCapitalized, previous.ownWorkCapitalized),
        otherOperatingIncome: calculateChange(current.otherOperatingIncome, previous.otherOperatingIncome),
        totalRevenue: calculateChange(
          (current.salesRevenue || 0) + (current.inventoryChange || 0) + 
          (current.ownWorkCapitalized || 0) + (current.otherOperatingIncome || 0),
          (previous.salesRevenue || 0) + (previous.inventoryChange || 0) + 
          (previous.ownWorkCapitalized || 0) + (previous.otherOperatingIncome || 0)
        ),
        costOfMaterials: calculateChange(current.costOfMaterials, previous.costOfMaterials),
        costOfServices: calculateChange(current.costOfServices, previous.costOfServices),
        personnelExpenses: calculateChange(
          (current.wagesAndSalaries || 0) + (current.socialSecurity || 0) + (current.pensionCosts || 0),
          (previous.wagesAndSalaries || 0) + (previous.socialSecurity || 0) + (previous.pensionCosts || 0)
        ),
        wagesAndSalaries: calculateChange(current.wagesAndSalaries, previous.wagesAndSalaries),
        socialSecurity: calculateChange(current.socialSecurity, previous.socialSecurity),
        pensionCosts: calculateChange(current.pensionCosts, previous.pensionCosts),
        depreciation: calculateChange(current.depreciation, previous.depreciation),
        otherOperatingExpenses: calculateChange(current.otherOperatingExpenses, previous.otherOperatingExpenses),
        totalExpenses: calculateChange(
          (current.costOfMaterials || 0) + (current.costOfServices || 0) + 
          (current.wagesAndSalaries || 0) + (current.socialSecurity || 0) + 
          (current.pensionCosts || 0) + (current.depreciation || 0) + 
          (current.otherOperatingExpenses || 0),
          (previous.costOfMaterials || 0) + (previous.costOfServices || 0) + 
          (previous.wagesAndSalaries || 0) + (previous.socialSecurity || 0) + 
          (previous.pensionCosts || 0) + (previous.depreciation || 0) + 
          (previous.otherOperatingExpenses || 0)
        ),
        operatingIncome: calculateChange(current.operatingIncome, previous.operatingIncome),
        interestIncome: calculateChange(current.interestIncome, previous.interestIncome),
        participationIncome: calculateChange(current.participationIncome, previous.participationIncome),
        interestExpenses: calculateChange(current.interestExpenses, previous.interestExpenses),
        financialResult: calculateChange(
          (current.interestIncome || 0) + (current.participationIncome || 0) - (current.interestExpenses || 0),
          (previous.interestIncome || 0) + (previous.participationIncome || 0) - (previous.interestExpenses || 0)
        ),
        earningsBeforeTaxes: calculateChange(current.earningsBeforeTaxes, previous.earningsBeforeTaxes),
        incomeTaxes: calculateChange(current.incomeTaxes, previous.incomeTaxes),
        netIncome: calculateChange(current.netIncome, previous.netIncome)
      } : null
    }

    return NextResponse.json({
      success: true,
      data: comparison
    })
  } catch (error) {
    console.error('Error fetching income statement comparison:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
