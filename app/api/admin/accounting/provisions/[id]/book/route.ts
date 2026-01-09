import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bookProvision } from '@/lib/accounting/provisionService'

/**
 * POST /api/admin/accounting/provisions/[id]/book
 * Book provision to accounting
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

    await bookProvision(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Provision booked successfully'
    })
  } catch (error) {
    console.error('Error booking provision:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Provision not found' },
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
