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

    const bookingId = params.id

    // In the new DirectBooking system, commissions are integral to bookings
    // Deleting is not recommended as it would affect the booking record
    // Instead, we could cancel the booking or reset commission fields
    
    return NextResponse.json(
      { error: 'Provisionen können nicht gelöscht werden. Sie sind Teil der Buchungsdaten. Bitte kontaktieren Sie den Administrator, falls eine Stornierung erforderlich ist.' },
      { status: 400 }
    )

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
