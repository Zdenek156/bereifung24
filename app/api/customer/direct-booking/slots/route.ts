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

    // Parse opening hours (handle double-escaped JSON)
    let openingHours = null
    console.log('Workshop opening hours raw:', workshop.openingHours)
    try {
      if (workshop.openingHours) {
        // Try to parse - might be double-escaped
        let parsed = JSON.parse(workshop.openingHours)
        // If it's a string after first parse, parse again (double-escaped)
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed)
        }
        openingHours = parsed
      }
      console.log('Parsed opening hours:', openingHours)
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
    console.log('Day of week:', dayOfWeek, 'Date:', date)
    
    if (!openingHours || !openingHours[dayOfWeek]) {
      console.log('No opening hours for', dayOfWeek, '- Available days:', openingHours ? Object.keys(openingHours) : 'none')
      return NextResponse.json({
        success: true,
        slots: [],
        message: `Werkstatt ist an diesem Tag (${dayOfWeek}) geschlossen`
      })
    }

    const dayHours = openingHours[dayOfWeek]
    console.log('Day hours for', dayOfWeek, ':', dayHours)
    
    // Check if day is closed
    if (!dayHours || (typeof dayHours === 'object' && dayHours.closed === true)) {
      console.log('Workshop closed on', dayOfWeek)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt ist an diesem Tag geschlossen'
      })
    }

    // Parse opening hours - support both formats:
    // 1. String format: "08:00-18:00"
    // 2. Object format: {from: "08:00", to: "18:00", closed: false}
    let openTime: string
    let closeTime: string
    
    if (typeof dayHours === 'string' && dayHours.includes('-')) {
      // Old format: "08:00-18:00"
      [openTime, closeTime] = dayHours.split('-')
    } else if (typeof dayHours === 'object' && dayHours.from && dayHours.to) {
      // New format: {from: "08:00", to: "18:00"}
      openTime = dayHours.from
      closeTime = dayHours.to
    } else {
      console.error('Invalid opening hours format for', dayOfWeek, ':', dayHours)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt ist an diesem Tag geschlossen'
      })
    }

    console.log('Open time:', openTime, 'Close time:', closeTime)
    
    // Generate time slots based on opening hours
    const slots = generateTimeSlots(openTime, closeTime, duration)

    // Get existing bookings for this date
    // For @db.Date fields (PostgreSQL DATE type), use ISO date string format (YYYY-MM-DD)
    // This is the correct way to query DATE columns in PostgreSQL via Prisma
    const dateString = date // Already in YYYY-MM-DD format from request
    
    console.log('Checking existing bookings for date:', dateString)
    
    const existingBookings = await prisma.directBooking.findMany({
      where: {
        workshopId,
        date: dateString, // Pass date string directly, not Date object
        status: { in: ['RESERVED', 'CONFIRMED', 'COMPLETED'] }
      }
    })
    
    console.log('Found existing bookings:', existingBookings.length)

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
