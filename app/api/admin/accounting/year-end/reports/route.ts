import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Generate Year-End Reports
 * Creates/updates Balance Sheet and Income Statement for the fiscal year
 */
export async function POST(request: NextRequest) {
  console.log('[YEAR-END REPORTS] API Called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[YEAR-END REPORTS] Session:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const year = body.year || body.fiscalYear || new Date().getFullYear()
    
    console.log('[YEAR-END REPORTS] Generating reports for year:', year)

    // Check if reports already exist
    const existingBalanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    const existingIncomeStatement = await prisma.incomeStatement.findUnique({
      where: { year }
    })

    let balanceSheetStatus = 'existing'
    let incomeStatementStatus = 'existing'

    // Generate Balance Sheet if it doesn't exist
    if (!existingBalanceSheet) {
      // Import the balance sheet service
      const { generateBalanceSheet } = await import('@/lib/accounting/balanceSheetService')
      await generateBalanceSheet(year)
      balanceSheetStatus = 'created'
      console.log('[YEAR-END REPORTS] Balance Sheet created')
    } else {
      console.log('[YEAR-END REPORTS] Balance Sheet already exists')
    }

    // Generate Income Statement if it doesn't exist
    if (!existingIncomeStatement) {
      // Import the income statement service
      const { generateIncomeStatement } = await import('@/lib/accounting/incomeStatementService')
      await generateIncomeStatement(year)
      incomeStatementStatus = 'created'
      console.log('[YEAR-END REPORTS] Income Statement created')
    } else {
      console.log('[YEAR-END REPORTS] Income Statement already exists')
    }

    return NextResponse.json({
      success: true,
      message: `Berichte für ${year} erfolgreich erstellt`,
      data: {
        balanceSheet: balanceSheetStatus,
        incomeStatement: incomeStatementStatus
      }
    })
  } catch (error) {
    console.error('[YEAR-END REPORTS] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Erstellen der Berichte'
    }, { status: 500 })
  }
}
