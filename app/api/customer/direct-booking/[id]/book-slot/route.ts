import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/customer/direct-booking/[id]/book-slot
 * Book a specific time slot after payment
 */

export async function POST(
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

    const { date, time } = await request.json()

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Datum und Uhrzeit erforderlich' },
        { status: 400 }
      )
    }

    // Get DirectBooking
    const directBooking = await prisma.directBooking.findUnique({
      where: { id: params.id },
      include: {
        workshop: true,
        vehicle: true,
        customer: true
      }
    })

    if (!directBooking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (directBooking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Verify payment
    if (directBooking.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Zahlung nicht abgeschlossen' },
        { status: 400 }
      )
    }

    // Check if already booked
    if (directBooking.bookingId) {
      return NextResponse.json(
        { error: 'Bereits gebucht' },
        { status: 400 }
      )
    }

    // Check slot availability
    const appointmentDate = new Date(date)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        workshopId: directBooking.workshopId,
        appointmentDate,
        appointmentTime: time,
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Termin ist nicht mehr verfügbar' },
        { status: 409 }
      )
    }

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        customerId: directBooking.customerId,
        workshopId: directBooking.workshopId,
        appointmentDate,
        appointmentTime: time,
        estimatedDuration: directBooking.durationMinutes || 60,
        status: 'CONFIRMED',
        paymentMethod: directBooking.paymentMethod === 'STRIPE' ? 'CARD' : 'PAYPAL',
        paymentStatus: 'COMPLETED',
        paidAt: directBooking.paidAt,
        wantsBalancing: directBooking.hasBalancing,
        wantsStorage: directBooking.hasStorage,
        // Link to TireRequest (if exists) or create minimal metadata
        tireRequestId: null // Direct booking has no prior tire request
      }
    })

    // Link DirectBooking to Booking
    await prisma.directBooking.update({
      where: { id: params.id },
      data: {
        bookingId: booking.id
      }
    })

    // TODO: Send confirmation email to customer
    // TODO: Send notification to workshop

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: 'Termin erfolgreich gebucht'
    })

  } catch (error) {
    console.error('Error booking slot:', error)
    return NextResponse.json(
      { error: 'Fehler beim Buchen des Termins' },
      { status: 500 }
    )
  }
}
