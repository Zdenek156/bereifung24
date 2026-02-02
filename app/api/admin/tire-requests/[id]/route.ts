import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Only admins and B24 employees can delete requests
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if request exists
    const tireRequest = await prisma.tireRequest.findUnique({
      where: { id },
      include: {
        offers: true,
        booking: true
      }
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Manually delete related records (since cascade delete might not be set up)
    // Delete in correct order to avoid foreign key violations
    
    // 1. Delete affiliate conversions
    await prisma.affiliateConversion.deleteMany({
      where: { tireRequestId: id }
    })
    
    // 2. Delete tire request views
    await prisma.tireRequestView.deleteMany({
      where: { tireRequestId: id }
    })
    
    // 3. Delete admin notes
    await prisma.tireRequestNote.deleteMany({
      where: { tireRequestId: id }
    })
    
    // 4. Delete reviews if booking exists (must be before commissions and booking)
    if (tireRequest.booking) {
      await prisma.review.deleteMany({
        where: { bookingId: tireRequest.booking.id }
      })
    }
    
    // 5. Delete commissions if booking exists (must be before booking)
    if (tireRequest.booking) {
      await prisma.commission.deleteMany({
        where: { bookingId: tireRequest.booking.id }
      })
    }
    
    // 6. Delete booking if exists
    if (tireRequest.booking) {
      await prisma.booking.delete({
        where: { id: tireRequest.booking.id }
      })
    }
    
    // 7. Delete all tire options for all offers
    for (const offer of tireRequest.offers) {
      await prisma.tireOption.deleteMany({
        where: { offerId: offer.id }
      })
    }
    
    // 8. Delete all offers
    await prisma.offer.deleteMany({
      where: { tireRequestId: id }
    })
    
    // 9. Finally delete the tire request
    await prisma.tireRequest.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Anfrage erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error deleting tire request:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Anfrage' },
      { status: 500 }
    )
  }
}
