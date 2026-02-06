import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/direct-booking/[id]/available-slots
 * Get busy slots for a workshop (public API - no auth required)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start- und Enddatum fehlen' },
        { status: 400 }
      )
    }

    // Get Workshop directly (params.id is workshopId)
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get busy slots from existing bookings for this workshop
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        workshopId: params.id,
        appointmentDate: {
          gte: start,
          lte: end
        },
        status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING'] }
      },
      select: {
        appointmentDate: true,
        appointmentTime: true,
        estimatedDuration: true
      }
    })

    // Format busy slots
    const busySlots = existingBookings.map(booking => ({
      date: booking.appointmentDate.toISOString().split('T')[0],
      time: booking.appointmentTime,
      duration: booking.estimatedDuration || 60
    }))

    // Return busy slots (client will generate available slots)
    return NextResponse.json({
      success: true,
      availableSlots: [], // Client generates based on workshop hours
      busySlots: busySlots
    })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zeitslots' },
      { status: 500 }
    )
  }
}
    if (directBooking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Parse opening hours (simplified - in production, parse properly from JSON/text)
    // Example: "Mo-Fr: 08:00-18:00, Sa: 09:00-13:00"
    const dayOfWeek = new Date(date).getDay() // 0 = Sunday, 6 = Saturday
    
    let openingTime = '08:00'
    let closingTime = '18:00'
    
    // Weekend check
    if (dayOfWeek === 0) {
      // Sunday - closed
      return NextResponse.json({
        success: true,
        slots: []
      })
    } else if (dayOfWeek === 6) {
      // Saturday - shorter hours
      openingTime = '09:00'
      closingTime = '13:00'
    }

    // Get existing bookings for this workshop on this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        workshopId: directBooking.workshopId,
        appointmentDate: new Date(date),
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      },
      select: {
        appointmentTime: true,
        estimatedDuration: true
      }
    })

    // Generate time slots (every 30 minutes)
    const slots = []
    const [openHour, openMinute] = openingTime.split(':').map(Number)
    const [closeHour, closeMinute] = closingTime.split(':').map(Number)
    
    let currentHour = openHour
    let currentMinute = openMinute
    
    while (
      currentHour < closeHour || 
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const time = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
      
      // Check if slot is available (no overlap with existing bookings)
      const isAvailable = !existingBookings.some(booking => {
        const bookingTime = booking.appointmentTime
        const bookingDuration = booking.estimatedDuration || 60
        
        // Simple overlap check
        const slotStart = currentHour * 60 + currentMinute
        const slotEnd = slotStart + (directBooking.durationMinutes || 60)
        
        const [bookingHour, bookingMinute] = bookingTime.split(':').map(Number)
        const bookingStart = bookingHour * 60 + bookingMinute
        const bookingEnd = bookingStart + bookingDuration
        
        return (slotStart < bookingEnd && slotEnd > bookingStart)
      })
      
      slots.push({
        time,
        available: isAvailable
      })
      
      // Increment by 30 minutes
      currentMinute += 30
      if (currentMinute >= 60) {
        currentMinute -= 60
        currentHour += 1
      }
    }

    return NextResponse.json({
      success: true,
      slots
    })

  } catch (error) {
    console.error('Error getting available slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Termine' },
      { status: 500 }
    )
  }
}
