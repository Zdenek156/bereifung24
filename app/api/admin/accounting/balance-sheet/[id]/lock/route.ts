import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { lockBalanceSheet } from '@/lib/accounting/balanceSheetService'

/**
 * POST /api/admin/accounting/balance-sheet/[id]/lock
 * Lock balance sheet to prevent further modifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Balance sheet ID is required' },
        { status: 400 }
      )
    }

    const balanceSheet = await lockBalanceSheet(id, session.user.id)

    return NextResponse.json({
      success: true,
      data: balanceSheet
    })
  } catch (error) {
    console.error('Error locking balance sheet:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Balance sheet not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('already locked')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
