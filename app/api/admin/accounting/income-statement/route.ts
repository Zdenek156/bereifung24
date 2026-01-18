import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateIncomeStatement } from '@/lib/accounting/incomeStatementService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/income-statement
 * Fetch income statements with optional filtering
 * Query params: year, fiscalYear
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
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

    const incomeStatements = await prisma.IncomeStatement.findMany({
      where,
      orderBy: {
        year: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: incomeStatements
    })
  } catch (error) {
    console.error('Error fetching income statements:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/income-statement
 * Generate new income statement
 * Body: { year: number, fiscalYear?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
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

    const incomeStatement = await generateIncomeStatement(year, fiscalYear)

    return NextResponse.json({
      success: true,
      data: incomeStatement
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating income statement:', error)

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
