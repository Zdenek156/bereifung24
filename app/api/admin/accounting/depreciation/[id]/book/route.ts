import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bookDepreciation } from '@/lib/accounting/depreciationService'

/**
 * POST /api/admin/accounting/depreciation/[id]/book
 * Book depreciation entry to accounting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Depreciation ID is required' },
        { status: 400 }
      )
    }

    await bookDepreciation(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Depreciation booked successfully'
    })
  } catch (error) {
    console.error('Error booking depreciation:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Depreciation entry not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('already booked')) {
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
