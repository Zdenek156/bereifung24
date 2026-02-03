import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/customer/direct-booking/reserve
 * Reserve a time slot temporarily (10 minutes) during payment
 * 
 * Body:
 * {
 *   workshopId: string,
 *   vehicleId: string,
 *   serviceType: string,
 *   date: string (YYYY-MM-DD),
 *   time: string (HH:MM),
 *   hasBalancing: boolean,
 *   hasStorage: boolean,
 *   totalPrice: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      workshopId,
      vehicleId,
      serviceType,
      date,
      time,
      hasBalancing,
      hasStorage,
      totalPrice
    } = body

    if (!workshopId || !vehicleId || !serviceType || !date || !time || !totalPrice) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if slot is still available
    const existingReservation = await prisma.directBooking.findFirst({
      where: {
        workshopId,
        date: new Date(date),
        time,
        status: { in: ['RESERVED', 'CONFIRMED'] }
      }
    })

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Dieser Termin wurde gerade gebucht. Bitte wählen Sie einen anderen.' },
        { status: 409 }
      )
    }

    // Create temporary reservation (expires in 10 minutes)
    const reservation = await prisma.directBooking.create({
      data: {
        customerId: customer.id,
        workshopId,
        vehicleId,
        serviceType,
        date: new Date(date),
        time,
        hasBalancing: hasBalancing || false,
        hasStorage: hasStorage || false,
        totalPrice,
        status: 'RESERVED',
        reservedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        paymentStatus: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      expiresAt: reservation.reservedUntil
    })

  } catch (error) {
    console.error('Error reserving slot:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Reservierung' },
      { status: 500 }
    )
  }
}
