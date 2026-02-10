import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/direct-booking/reservation/[id]
 * Verify reservation exists and is still valid
 * Returns 410 if expired, 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservationId = params.id

    // Get customer from session user
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Fetch reservation from DirectBooking table (status = RESERVED)
    const reservation = await prisma.directBooking.findUnique({
      where: { id: reservationId }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservierung nicht gefunden' },
        { status: 404 }
      )
    }

    // If booking is already confirmed/completed, return it (not expired)
    if (reservation.status === 'CONFIRMED' || reservation.status === 'COMPLETED') {
      console.log('[RESERVATION API] Booking already confirmed:', {
        id: reservationId,
        status: reservation.status
      })
      return NextResponse.json({
        success: true,
        reservation
      })
    }

    // Check if RESERVED booking has expired
    if (reservation.status === 'RESERVED' && reservation.reservedUntil && new Date() > reservation.reservedUntil) {
      console.log('[RESERVATION API] Reservation expired, deleting:', reservationId)
      
      // Delete expired reservation
      await prisma.directBooking.delete({
        where: { id: reservationId }
      })

      return NextResponse.json(
        { error: 'Reservierung ist abgelaufen' },
        { status: 410 } // 410 Gone
      )
    }

    // Verify customer owns this reservation
    if (reservation.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Zugriff verweigert' },
        { status: 403 }
      )
    }

    console.log('[RESERVATION API] Reservation verified:', {
      id: reservationId,
      status: reservation.status,
      expiresAt: reservation.reservedUntil
    })

    return NextResponse.json({
      success: true,
      reservation
    })
  } catch (error) {
    console.error('[RESERVATION API] Error verifying reservation:', error)
    return NextResponse.json(
      { error: 'Fehler beim Überprüfen der Reservierung' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customer/direct-booking/reservation/[id]
 * Clean up reservation after booking is created
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservationId = params.id

    // Get customer from session user
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify reservation exists and belongs to user
    const reservation = await prisma.directBooking.findUnique({
      where: { id: reservationId }
    })

    if (!reservation) {
      // Already deleted, no problem
      return NextResponse.json({ success: true })
    }

    if (reservation.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Zugriff verweigert' },
        { status: 403 }
      )
    }

    // Delete reservation
    await prisma.directBooking.delete({
      where: { id: reservationId }
    })

    console.log('[RESERVATION API] Reservation deleted:', reservationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[RESERVATION API] Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Reservierung' },
      { status: 500 }
    )
  }
}
