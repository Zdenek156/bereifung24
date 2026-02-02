import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const commissionId = params.id

    // Check if commission exists
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId }
    })

    if (!commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    // Delete the commission
    await prisma.commission.delete({
      where: { id: commissionId }
    })

    console.log(`🗑️ Commission deleted: ${commissionId} (${commission.commissionAmount}€)`)

    return NextResponse.json({
      success: true,
      message: 'Commission deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting commission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete commission' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const commissionId = params.id
    const body = await request.json()

    // Update the commission
    const updated = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: body.status,
        notes: body.notes,
        sepaReference: body.sepaReference,
        sepaStatus: body.sepaStatus,
        billedAt: body.billedAt ? new Date(body.billedAt) : null,
        collectedAt: body.collectedAt ? new Date(body.collectedAt) : null
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error: any) {
    console.error('Error updating commission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update commission' },
      { status: 500 }
    )
  }
}
