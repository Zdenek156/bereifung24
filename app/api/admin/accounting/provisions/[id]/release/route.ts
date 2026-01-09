import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { releaseProvision } from '@/lib/accounting/provisionService'

/**
 * POST /api/admin/accounting/provisions/[id]/release
 * Release provision
 * Body: { amount?: number, reason?: string }
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
        { success: false, error: 'Provision ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { amount, reason } = body

    await releaseProvision(id, session.user.id, amount, reason)

    return NextResponse.json({
      success: true,
      message: 'Provision released successfully'
    })
  } catch (error) {
    console.error('Error releasing provision:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Provision not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('not booked') || error.message.includes('already released')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        )
      }
      if (error.message.includes('exceeds')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
