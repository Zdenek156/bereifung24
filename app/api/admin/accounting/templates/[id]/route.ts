import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/admin/accounting/templates/[id]
 * Delete a booking template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.bookingTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking template:', error)
    return NextResponse.json(
      { error: 'Failed to delete booking template' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/templates/[id]/use
 * Increment use count when template is used
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.bookingTemplate.update({
      where: { id: params.id },
      data: { useCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        amount: parseFloat(template.amount.toString()),
      },
    })
  } catch (error) {
    console.error('Error updating template use count:', error)
    return NextResponse.json(
      { error: 'Failed to update template use count' },
      { status: 500 }
    )
  }
}
