import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBusySlots } from '@/lib/google-calendar'

/**
 * GET /api/customer/direct-booking/[id]/available-slots
 * Get busy slots for a workshop (public API - no auth required)
 * Includes busy slots from:
 * 1. Existing bookings in database
 * 2. Google Calendar events (workshop or employee calendar)
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

    // Get Workshop with employees (for Google Calendar)
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      include: {
        employees: {
          select: {
            id: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            name: true,
            email: true
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

    // Group busy slots by date
    const busySlotsByDate: Record<string, string[]> = {}
    
    existingBookings.forEach(booking => {
      const dateStr = booking.appointmentDate.toISOString().split('T')[0]
      if (!busySlotsByDate[dateStr]) {
        busySlotsByDate[dateStr] = []
      }
      busySlotsByDate[dateStr].push(booking.appointmentTime)
    })

    // 2. Check Google Calendar for busy slots
    let googleCalendarId: string | null = null
    let googleAccessToken: string | null = null
    let googleRefreshToken: string | null = null
    
    // Use workshop calendar or first employee calendar
    if (workshop.calendarMode === 'workshop' && workshop.googleCalendarId) {
      googleCalendarId = workshop.googleCalendarId
      googleAccessToken = workshop.googleAccessToken
      googleRefreshToken = workshop.googleRefreshToken
      console.log(`[CUSTOMER SLOTS API] Using WORKSHOP Google Calendar: ${googleCalendarId}`)
    } else if (workshop.employees.length > 0) {
      const employeeWithCalendar = workshop.employees.find(e => e.googleCalendarId && e.googleAccessToken)
      if (employeeWithCalendar) {
        googleCalendarId = employeeWithCalendar.googleCalendarId
        googleAccessToken = employeeWithCalendar.googleAccessToken
        googleRefreshToken = employeeWithCalendar.googleRefreshToken
        console.log(`[CUSTOMER SLOTS API] Using EMPLOYEE Google Calendar: ${googleCalendarId}`)
      }
    }
    
    if (googleCalendarId && googleAccessToken && googleRefreshToken) {
      try {
        const gcalBusySlots = await getBusySlots(
          googleAccessToken,
          googleRefreshToken,
          googleCalendarId,
          start.toISOString(),
          end.toISOString()
        )
        
        console.log(`[CUSTOMER SLOTS API] Found ${gcalBusySlots.length} busy slots from Google Calendar`)
        
        // Add Google Calendar busy times to busySlotsByDate
        gcalBusySlots.forEach((busy: any) => {
          // Parse ISO datetime with timezone: "2026-02-19T08:00:00+01:00"
          const startMatch = busy.start.match(/(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
          const endMatch = busy.end.match(/(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
          
          if (!startMatch || !endMatch) return
          
          const dateStr = startMatch[1] // "2026-02-19"
          const startTime = `${startMatch[2]}:${startMatch[3]}` // "08:00"
          const endTime = `${endMatch[2]}:${endMatch[3]}` // "09:00"
          
          if (!busySlotsByDate[dateStr]) {
            busySlotsByDate[dateStr] = []
          }
          
          // Add all 30-min slots between start and end time
          let currentHour = parseInt(startMatch[2])
          let currentMinute = parseInt(startMatch[3])
          const endHour = parseInt(endMatch[2])
          const endMinute = parseInt(endMatch[3])
          
          while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
            if (!busySlotsByDate[dateStr].includes(timeStr)) {
              busySlotsByDate[dateStr].push(timeStr)
            }
            
            currentMinute += 30
            if (currentMinute >= 60) {
              currentMinute -= 60
              currentHour += 1
            }
          }
        })
      } catch (error) {
        console.error('[CUSTOMER SLOTS API] Error fetching Google Calendar:', error)
        // Continue without Google Calendar slots
      }
    }

    // Return busy slots grouped by date (client will generate available slots)
    return NextResponse.json({
      success: true,
      availableSlots: [], // Client generates based on workshop hours
      busySlots: busySlotsByDate
    })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zeitslots' },
      { status: 500 }
    )
  }
}
