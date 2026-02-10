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
      basePrice,
      balancingPrice,
      storagePrice,
      hasBalancing,
      hasStorage,
      totalPrice
    } = body

    if (!workshopId || !vehicleId || !serviceType || !date || !time || totalPrice === undefined) {
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
    // WORKAROUND: @db.Date fields don't support direct equality in Prisma
    const dateOnly = date // Already in YYYY-MM-DD format from frontend
    
    // FIRST: Delete expired reservations (older than 10 minutes)
    const now = new Date()
    await prisma.directBooking.deleteMany({
      where: {
        status: 'RESERVED',
        reservedUntil: {
          lt: now // Less than now = expired
        }
      }
    })
    
    // THEN: Fetch all bookings for this workshop and filter in code
    // NOTE: Can't use status: { in: [...] } because Prisma doesn't support it for String fields
    const allBookings = await prisma.directBooking.findMany({
      where: {
        workshopId
      },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        reservedUntil: true
      }
    })
    
    // Filter for matching date, time AND active status (RESERVED or CONFIRMED)
    // For RESERVED status, also check if not expired
    const existingReservation = allBookings.find(booking => {
      const bookingDateStr = booking.date.toISOString().split('T')[0]
      
      if (bookingDateStr !== dateOnly || booking.time !== time) {
        return false // Different date or time
      }
      
      if (booking.status === 'CONFIRMED') {
        return true // Confirmed bookings always block the slot
      }
      
      if (booking.status === 'RESERVED') {
        // Check if reservation is still valid (not expired)
        return booking.reservedUntil && booking.reservedUntil > now
      }
      
      return false
    })

    if (existingReservation) {
      console.log('[RESERVE] Slot already taken:', { date: dateOnly, time, status: existingReservation.status })
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
        date: new Date(dateOnly), // Convert YYYY-MM-DD string to Date object
        time,
        durationMinutes: 60, // Default 60 minutes for wheel change
        basePrice: basePrice || 0,
        balancingPrice: balancingPrice || 0,
        storagePrice: storagePrice || 0,
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
