import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { approveBalanceSheet } from '@/lib/accounting/balanceSheetService'

/**
 * POST /api/admin/accounting/balance-sheet/[id]/approve
 * Approve balance sheet (requires locked status)
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

    const balanceSheet = await approveBalanceSheet(id, session.user.id)

    return NextResponse.json({
      success: true,
      data: balanceSheet
    })
  } catch (error) {
    console.error('Error approving balance sheet:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Balance sheet not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('must be locked') || error.message.includes('already approved')) {
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
