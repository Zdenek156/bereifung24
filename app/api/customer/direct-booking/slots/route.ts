import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/customer/direct-booking/slots
 * Get available time slots for a workshop service
 * 
 * Body:
 * {
 *   workshopId: string,
 *   serviceType: string,
 *   date: string (YYYY-MM-DD),
 *   duration: number (minutes)
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
    const { workshopId, serviceType, date, duration = 60 } = body

    if (!workshopId || !serviceType || !date) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Get workshop with opening hours
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        workshopVacations: {
          where: {
            startDate: { lte: new Date(date) },
            endDate: { gte: new Date(date) }
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if date is vacation day
    if (workshop.workshopVacations.length > 0) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt hat an diesem Tag Urlaub'
      })
    }

    // Parse opening hours (simplified - assumes JSON format)
    let openingHours = null
    try {
      openingHours = workshop.openingHours ? JSON.parse(workshop.openingHours) : null
    } catch (error) {
      console.error('Failed to parse opening hours:', error)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt hat keine gültigen Öffnungszeiten konfiguriert'
      })
    }

    // Get day of week (monday, tuesday, etc.)
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    if (!openingHours || !openingHours[dayOfWeek]) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt ist an diesem Tag geschlossen'
      })
    }

    const dayHours = openingHours[dayOfWeek]
    if (!dayHours || typeof dayHours !== 'string' || !dayHours.includes('-')) {
      console.error('Invalid opening hours format for', dayOfWeek, ':', dayHours)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt ist an diesem Tag geschlossen'
      })
    }

    // Generate time slots based on opening hours
    const [openTime, closeTime] = dayHours.split('-')
    const slots = generateTimeSlots(openTime, closeTime, duration)

    // Get existing bookings for this date
    const existingBookings = await prisma.directBooking.findMany({
      where: {
        workshopId,
        date: new Date(date),
        status: { in: ['RESERVED', 'CONFIRMED', 'COMPLETED'] }
      }
    })

    // Filter out booked slots
    const availableSlots = slots.filter(slot => {
      const slotTime = slot.time
      return !existingBookings.some(booking => {
        const bookingTime = booking.time
        return bookingTime === slotTime
      })
    })

    return NextResponse.json({
      success: true,
      slots: availableSlots,
      workshop: {
        id: workshop.id,
        name: workshop.name,
        openingHours: openingHours[dayOfWeek]
      }
    })

  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der verfügbaren Termine' },
      { status: 500 }
    )
  }
}

// Helper function to generate time slots
function generateTimeSlots(openTime: string, closeTime: string, duration: number): Array<{time: string, available: boolean}> {
  const slots: Array<{time: string, available: boolean}> = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)
  
  let currentTime = openHour * 60 + openMin // minutes since midnight
  const endTime = closeHour * 60 + closeMin
  
  while (currentTime + duration <= endTime) {
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    slots.push({
      time: timeString,
      available: true
    })
    
    currentTime += duration
  }
  
  return slots
}
