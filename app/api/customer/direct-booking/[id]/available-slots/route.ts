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

    console.log(`\n[CUSTOMER SLOTS API] Request for workshop ${params.id}`)
    console.log(`[CUSTOMER SLOTS API] Date range: ${startDate} to ${endDate}`)

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start- und Enddatum fehlen' },
        { status: 400 }
      )
    }

    // Get Workshop with employees (for Google Calendar) and opening hours
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        openingHours: true,
        calendarMode: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        employees: {
          select: {
            id: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            name: true,
            email: true
          }
        },
        workshopVacations: {
          where: {
            startDate: { lte: new Date(endDate) },
            endDate:   { gte: new Date(startDate) },
          },
          select: { startDate: true, endDate: true }
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

    // Group busy slots by date (accounting for booking duration)
    const busySlotsByDate: Record<string, string[]> = {}
    
    existingBookings.forEach(booking => {
      const dateStr = booking.appointmentDate.toISOString().split('T')[0]
      if (!busySlotsByDate[dateStr]) {
        busySlotsByDate[dateStr] = []
      }
      
      // Block all slots covered by this booking based on duration
      const [startHour, startMinute] = booking.appointmentTime.split(':').map(Number)
      const duration = booking.estimatedDuration || 60 // Default 60 minutes
      const endMinutes = startHour * 60 + startMinute + duration
      const endHour = Math.floor(endMinutes / 60)
      const endMinute = endMinutes % 60
      
      // Block all 30-minute slots from start to end (including partial overlaps)
      let currentHour = startHour
      let currentMinute = startMinute
      
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
      
      // If the booking ends after the hour mark (e.g., 09:20), also block that hour's slot
      if (endMinute > 0 && endMinute <= 30) {
        const lastSlotTime = `${String(endHour).padStart(2, '0')}:00`
        if (!busySlotsByDate[dateStr].includes(lastSlotTime)) {
          busySlotsByDate[dateStr].push(lastSlotTime)
        }
      }
    })

    // 2. Check Google Calendar for busy slots
    let googleCalendarId: string | null = null
    let googleAccessToken: string | null = null
    let googleRefreshToken: string | null = null
    
    console.log(`[CUSTOMER SLOTS API] Workshop calendarMode: ${workshop.calendarMode}`)
    console.log(`[CUSTOMER SLOTS API] Workshop has googleCalendarId: ${!!workshop.googleCalendarId}`)
    console.log(`[CUSTOMER SLOTS API] Workshop has googleAccessToken: ${!!workshop.googleAccessToken}`)
    console.log(`[CUSTOMER SLOTS API] Employees count: ${workshop.employees.length}`)
    
    // Use workshop calendar or first employee calendar
    if (workshop.calendarMode === 'workshop' && workshop.googleCalendarId) {
      googleCalendarId = workshop.googleCalendarId
      googleAccessToken = workshop.googleAccessToken
      googleRefreshToken = workshop.googleRefreshToken
      console.log(`[CUSTOMER SLOTS API] ✅ Using WORKSHOP Google Calendar: ${googleCalendarId}`)
    } else if (workshop.employees.length > 0) {
      const employeeWithCalendar = workshop.employees.find(e => e.googleCalendarId && e.googleAccessToken)
      if (employeeWithCalendar) {
        googleCalendarId = employeeWithCalendar.googleCalendarId
        googleAccessToken = employeeWithCalendar.googleAccessToken
        googleRefreshToken = employeeWithCalendar.googleRefreshToken
        console.log(`[CUSTOMER SLOTS API] ✅ Using EMPLOYEE Google Calendar: ${googleCalendarId}`)
      } else {
        console.log(`[CUSTOMER SLOTS API] ❌ No employee with calendar found`)
      }
    } else {
      console.log(`[CUSTOMER SLOTS API] ❌ No Google Calendar configured`)
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
          // Parse ISO datetime with timezone correctly using Date object
          // busy.start is like "2026-02-19T08:00:00+01:00"
          const busyStartDate = new Date(busy.start)
          const busyEndDate = new Date(busy.end)
          
          // Convert to Berlin timezone to get the correct local time
          const dateStr = busyStartDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }) // "2026-02-19"
          const startTime = busyStartDate.toLocaleTimeString('de-DE', { 
            timeZone: 'Europe/Berlin', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }) // "08:00"
          const endTime = busyEndDate.toLocaleTimeString('de-DE', { 
            timeZone: 'Europe/Berlin', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }) // "09:20"
          
          console.log(`[CUSTOMER SLOTS API] Blocking busy slot: ${startTime} - ${endTime} on ${dateStr}`)
          
          if (!busySlotsByDate[dateStr]) {
            busySlotsByDate[dateStr] = []
          }
          
          // Add all 30-min slots that would conflict with this event
          // A slot at X:00 is blocked if the event extends past X:00
          // Example: Event 08:00-09:20 blocks slots 08:00, 08:30, 09:00
          // (because a booking at 09:00 would conflict with an event ending at 09:20)
          
          // Parse times from Berlin timezone strings
          const [startHour, startMinute] = startTime.split(':').map(Number)
          const [endHour, endMinute] = endTime.split(':').map(Number)
          
          let currentHour = startHour
          let currentMinute = startMinute
          
          // Block all slots from start up to (but not including) the end
          // BUT if end time is not on a 30-min boundary, also block the slot at the last 30-min mark
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
          
          // If the event ends after the hour mark (e.g., 09:20), also block that hour's slot
          // This prevents booking a slot at 09:00 when an event runs until 09:20
          if (endMinute > 0 && endMinute <= 30) {
            const lastSlotTime = `${String(endHour).padStart(2, '0')}:00`
            if (!busySlotsByDate[dateStr].includes(lastSlotTime)) {
              busySlotsByDate[dateStr].push(lastSlotTime)
            }
          }
        })
      } catch (error) {
        console.error('[CUSTOMER SLOTS API] Error fetching Google Calendar:', error)
        // Continue without Google Calendar slots
      }
    }

    // Build vacation dates list (individual YYYY-MM-DD strings)
    const vacationDates: string[] = []
    for (const vac of workshop.workshopVacations || []) {
      const cur = new Date(vac.startDate)
      const vacEnd = new Date(vac.endDate)
      while (cur <= vacEnd) {
        vacationDates.push(cur.toISOString().split('T')[0])
        cur.setDate(cur.getDate() + 1)
      }
    }

    // Return busy slots grouped by date + opening hours + vacation dates
    return NextResponse.json({
      success: true,
      availableSlots: [], // Client generates based on workshop hours
      busySlots: busySlotsByDate,
      openingHours: workshop.openingHours, // Send opening hours to client
      vacationDates,
    })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zeitslots' },
      { status: 500 }
    )
  }
}
