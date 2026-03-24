import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBusySlots } from '@/lib/google-calendar'
import { isPublicHolidayByZip } from '@/lib/german-holidays'

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
        user: { select: { zipCode: true } },
        employees: {
          select: {
            id: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            name: true,
            email: true,
            workingHours: true,
            employeeVacations: {
              where: {
                startDate: { lte: new Date(endDate) },
                endDate:   { gte: new Date(startDate) },
              },
              select: { startDate: true, endDate: true }
            }
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
    
    // Use workshop calendar or ALL employee calendars
    if (workshop.calendarMode === 'workshop' && workshop.googleCalendarId) {
      googleCalendarId = workshop.googleCalendarId
      googleAccessToken = workshop.googleAccessToken
      googleRefreshToken = workshop.googleRefreshToken
      console.log(`[CUSTOMER SLOTS API] ✅ Using WORKSHOP Google Calendar: ${googleCalendarId}`)
    } else {
      // Find ALL employees with connected calendar (vacation is handled separately)
      const empsWithCal = workshop.employees.filter(e => e.googleCalendarId && e.googleAccessToken && e.googleRefreshToken)
      if (empsWithCal.length > 0) {
        // Use first employee's credentials for freebusy query, but query all calendars
        googleCalendarId = empsWithCal[0].googleCalendarId
        googleAccessToken = empsWithCal[0].googleAccessToken
        googleRefreshToken = empsWithCal[0].googleRefreshToken
        console.log(`[CUSTOMER SLOTS API] ✅ Using EMPLOYEE Google Calendar: ${empsWithCal.map(e => e.name).join(', ')} (${empsWithCal.length} calendars)`)
      } else {
        console.log(`[CUSTOMER SLOTS API] ❌ No employee with calendar found`)
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
          const busyStartDate = new Date(busy.start)
          const busyEndDate = new Date(busy.end)
          
          // Check if this is an all-day event (spans 24h or more)
          const durationMs = busyEndDate.getTime() - busyStartDate.getTime()
          const isAllDay = durationMs >= 24 * 60 * 60 * 1000

          if (isAllDay) {
            // Block all dates covered by this all-day event
            const cur = new Date(busyStartDate)
            while (cur < busyEndDate) {
              const dateStr = cur.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
              if (!busySlotsByDate[dateStr]) busySlotsByDate[dateStr] = []
              // Block every 30-min slot from 00:00 to 23:30
              for (let m = 0; m < 24 * 60; m += 30) {
                const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
                if (!busySlotsByDate[dateStr].includes(t)) busySlotsByDate[dateStr].push(t)
              }
              cur.setDate(cur.getDate() + 1)
            }
            return
          }

          // Regular (non-all-day) event
          const dateStr = busyStartDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
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

    // Also check employee vacations — if ALL employees with calendars are on vacation, block the date
    const employeesWithCalendar = (workshop.employees || []).filter(e => e.googleCalendarId && e.googleAccessToken)
    if (employeesWithCalendar.length > 0) {
      // Check each date in range
      const rangeStart = new Date(startDate)
      const rangeEnd = new Date(endDate)
      const cur = new Date(rangeStart)
      while (cur <= rangeEnd) {
        const dateStr = cur.toISOString().split('T')[0]
        if (!vacationDates.includes(dateStr)) {
          const allOnVacation = employeesWithCalendar.every(emp => {
            return (emp.employeeVacations || []).some((v: any) => {
              const vs = new Date(v.startDate).toISOString().split('T')[0]
              const ve = new Date(v.endDate).toISOString().split('T')[0]
              return dateStr >= vs && dateStr <= ve
            })
          })
          if (allOnVacation) {
            vacationDates.push(dateStr)
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
    }

    // Add public holidays based on workshop ZIP code
    const wsZip3 = (workshop as any).user?.zipCode
    if (wsZip3) {
      const rangeStart = new Date(startDate)
      const rangeEnd = new Date(endDate)
      const cur = new Date(rangeStart)
      while (cur <= rangeEnd) {
        const dateStr = cur.toISOString().split('T')[0]
        if (!vacationDates.includes(dateStr) && isPublicHolidayByZip(dateStr, wsZip3)) {
          vacationDates.push(dateStr)
        }
        cur.setDate(cur.getDate() + 1)
      }
    }

    // Block days where no employee with calendar is available to work
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    {
      const rangeStart = new Date(startDate)
      const rangeEnd = new Date(endDate)
      const cur = new Date(rangeStart)
      while (cur <= rangeEnd) {
        const dateStr = cur.toISOString().split('T')[0]
        if (!vacationDates.includes(dateStr)) {
          const dayName = dayNames[cur.getDay()]
          const hasAvailableEmployee = employeesWithCalendar.some(emp => {
            // Check if employee is on vacation this day
            const onVacation = (emp.employeeVacations || []).some((v: any) => {
              const vs = new Date(v.startDate).toISOString().split('T')[0]
              const ve = new Date(v.endDate).toISOString().split('T')[0]
              return dateStr >= vs && dateStr <= ve
            })
            if (onVacation) return false
            // Check if employee works this day
            if (emp.workingHours) {
              try {
                let hours = JSON.parse(emp.workingHours as string)
                if (typeof hours === 'string') hours = JSON.parse(hours)
                const dayHours = hours[dayName]
                if (!dayHours || !dayHours.working) return false
              } catch (e) { /* if parsing fails, assume they work */ }
            }
            return true
          })
          if (!hasAvailableEmployee) {
            vacationDates.push(dateStr)
          }
        }
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
