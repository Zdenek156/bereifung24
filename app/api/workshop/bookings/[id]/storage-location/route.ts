import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/workshop/bookings/[id]/storage-location
 * Set or update the storage location for a booking with hasStorage=true
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    const { storageLocation } = await request.json()

    if (typeof storageLocation !== 'string') {
      return NextResponse.json(
        { error: 'storageLocation muss ein String sein' },
        { status: 400 }
      )
    }

    // Get workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Find booking and verify ownership
    const booking = await prisma.directBooking.findFirst({
      where: {
        id: params.id,
        workshopId: workshop.id,
        hasStorage: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden oder keine Einlagerung' },
        { status: 404 }
      )
    }

    // Update storage location
    const updated = await prisma.directBooking.update({
      where: { id: params.id },
      data: { storageLocation: storageLocation.trim() || null },
      select: { id: true, storageLocation: true }
    })

    return NextResponse.json({ success: true, storageLocation: updated.storageLocation })

  } catch (error) {
    console.error('[Storage Location] Error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
