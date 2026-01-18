import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { finalizeYearEnd } from '@/lib/accounting/yearEndClosingService'

/**
 * POST /api/admin/accounting/year-end-closing/[id]/finalize
 * Finalize year-end closing
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
        { success: false, error: 'Year-end closing ID is required' },
        { status: 400 }
      )
    }

    await finalizeYearEnd(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Year-end closing finalized successfully'
    })
  } catch (error) {
    console.error('Error finalizing year-end closing:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Year-end closing not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('already finalized') || error.message.includes('must be')) {
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
