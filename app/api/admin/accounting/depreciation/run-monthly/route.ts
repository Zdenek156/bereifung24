import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runMonthlyDepreciation } from '@/lib/accounting/depreciationService'

/**
 * POST /api/admin/accounting/depreciation/run-monthly
 * Run monthly depreciation for all active assets
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await runMonthlyDepreciation(session.user.id)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error running monthly depreciation:', error)

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
