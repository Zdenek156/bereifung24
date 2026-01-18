import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBalanceSheet } from '@/lib/accounting/balanceSheetService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/balance-sheet
 * Fetch balance sheets with optional filtering
 * Query params: year, fiscalYear
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const fiscalYear = searchParams.get('fiscalYear')

    const where: any = {}

    if (year) {
      where.year = parseInt(year)
    }

    if (fiscalYear) {
      where.fiscalYear = fiscalYear
    }

    const balanceSheets = await prisma.BalanceSheet.findMany({
      where,
      orderBy: {
        year: 'desc'
      }
    })

    // Transform assets/liabilities to aktiva/passiva for frontend
    const transformedBalanceSheets = balanceSheets.map(sheet => ({
      ...sheet,
      aktiva: sheet.assets,
      passiva: sheet.liabilities
    }))

    return NextResponse.json({
      success: true,
      data: transformedBalanceSheets
    })
  } catch (error) {
    console.error('Error fetching balance sheets:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/balance-sheet
 * Generate new balance sheet
 * Body: { year: number, fiscalYear?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { year, fiscalYear } = body

    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Year is required and must be a number' },
        { status: 400 }
      )
    }

    const balanceSheet = await generateBalanceSheet(year, fiscalYear)

    return NextResponse.json({
      success: true,
      data: balanceSheet
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating balance sheet:', error)
    
    if (error instanceof Error && error.message.includes('already locked')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
