import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBusySlots } from '@/lib/google-calendar'

// Mark route as dynamic (no static generation)
export const dynamic = 'force-dynamic'

// Verfügbare Zeitslots für ein bestimmtes Datum abrufen
// PUBLIC API - Wird für Direct Booking verwendet (kein Login erforderlich)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const workshopId = searchParams.get('workshopId')
    const serviceType = searchParams.get('serviceType')
    
    if (!date) {
      return NextResponse.json({ error: 'Datum erforderlich' }, { status: 400 })
    }

    if (!workshopId) {
      return NextResponse.json({ error: 'Werkstatt-ID erforderlich' }, { status: 400 })
    }

    // Hole Workshop-Daten anhand der übergebenen workshopId
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        employees: {
          include: {
            employeeVacations: true,
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    console.log(`[SLOTS API] Workshop: ${workshop.companyName} (${workshop.id})`)
    console.log(`[SLOTS API] Calendar Mode: ${workshop.calendarMode || 'employees'}`)
    console.log(`[SLOTS API] Date: ${date}`)
    console.log(`[SLOTS API] Service: ${serviceType}`)
    console.log(`[SLOTS API] Total employees: ${workshop.employees.length}`)

    // Bestimme Wochentag
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    console.log(`[SLOTS API] Day of week: ${dayOfWeek}`)
    
    let dayWorkingHours: { from: string; to: string; working?: boolean; closed?: boolean } | null = null
    
    // OPTION 1: Werkstatt-Kalender (calendarMode = "workshop")
    if (workshop.calendarMode === 'workshop' && workshop.openingHours) {
      console.log('[SLOTS API] Using WORKSHOP calendar mode')
      
      try {
        const openingHours = typeof workshop.openingHours === 'string' 
          ? JSON.parse(workshop.openingHours) 
          : workshop.openingHours
        
        // openingHours Format: { monday: { from: '08:00', to: '18:00', closed: false }, ... }
        const hours = openingHours[dayOfWeek]
        console.log(`[SLOTS API] Workshop opening hours for ${dayOfWeek}:`, hours)
        
        // Check if open (either working: true OR closed: false)
        if (hours && ((hours.working === true) || (hours.closed === false))) {
          dayWorkingHours = hours
          console.log('[SLOTS API] Workshop is OPEN on this day')
        } else {
          console.log('[SLOTS API] Workshop is CLOSED on this day')
        }
      } catch (e) {
        console.error('[SLOTS API] Failed to parse workshop openingHours:', e)
      }
    }
    
    // OPTION 2: Mitarbeiter-Kalender (calendarMode = "employees" ODER kein Workshop-Kalender)
    if (!dayWorkingHours) {
      console.log('[SLOTS API] Using EMPLOYEE calendar mode (fallback or configured)')
      
      // Sammle alle verfügbaren Mitarbeiter für diesen Tag
      const availableEmployees = workshop.employees.filter(emp => {
        // Prüfe ob Urlaub
        const isOnVacation = emp.employeeVacations.some(v => {
          const start = new Date(v.startDate)
          const end = new Date(v.endDate)
          const checkDate = new Date(date)
          return checkDate >= start && checkDate <= end
        })
        
        if (isOnVacation) return false
        
        // Prüfe Arbeitszeiten (workingHours ist ein JSON-String mit Objekt)
        if (!emp.workingHours) return false
        const workingHours = typeof emp.workingHours === 'string' 
          ? JSON.parse(emp.workingHours) 
          : emp.workingHours
        
        // workingHours ist ein Objekt wie { monday: { from: '08:00', to: '17:00', working: true }, ... }
        const workingHour = workingHours[dayOfWeek]
        return workingHour && workingHour.working
      })

      console.log(`[SLOTS API] Available employees: ${availableEmployees.length}`)
      
      if (availableEmployees.length === 0) {
        console.log('[SLOTS API] No employees available for this day')
        return NextResponse.json({ slots: [] })
      }

      // Hole Arbeitszeiten des ersten verfügbaren Mitarbeiters (der mit Google Calendar verbunden ist)
      const employee = availableEmployees.find(emp => emp.googleCalendarId && emp.googleRefreshToken) || availableEmployees[0]
      
      console.log(`[SLOTS API] Selected employee: ${employee.name || employee.email}`)
      
      const workingHours = typeof employee.workingHours === 'string' 
        ? JSON.parse(employee.workingHours) 
        : employee.workingHours
      
      dayWorkingHours = workingHours[dayOfWeek]
      console.log(`[SLOTS API] Employee working hours for ${dayOfWeek}:`, dayWorkingHours)
    }
    
    // Check if we have valid working hours (either working: true OR closed: false)
    const isOpen = dayWorkingHours && (
      (dayWorkingHours.working === true) || 
      (dayWorkingHours.closed === false)
    )
    
    if (!isOpen) {
      console.log('[SLOTS API] Not working/open on this day')
      return NextResponse.json({ slots: [] })
    }

    // Parse Arbeitszeiten (z.B. "08:00" bis "17:00")
    const [startHour, startMinute] = dayWorkingHours.from.split(':').map(Number)
    const [endHour, endMinute] = dayWorkingHours.to.split(':').map(Number)
    
    // Generiere Zeitslots basierend auf den tatsächlichen Arbeitszeiten (alle 30 Minuten)
    const slots = []
    let currentHour = startHour
    let currentMinute = startMinute
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      slots.push({
        time: timeString,
        available: true
      })
      
      // Nächster Slot (+30 Minuten)
      currentMinute += 30
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour++
      }
    }

    console.log(`[SLOTS API] Generated ${slots.length} total slots`)

    // 1. Prüfe bestehende Termine in der Datenbank
    const startDate = new Date(date + 'T00:00:00')
    const endDate = new Date(date + 'T23:59:59')
    console.log(`[SLOTS API] Checking bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    const existingAppointments = await prisma.booking.findMany({
      where: {
        workshopId: workshop.id,
        appointmentDate: {
          gte: startDate,
          lt: endDate
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    console.log(`[SLOTS API] Existing DB appointments: ${existingAppointments.length}`)
    existingAppointments.forEach(apt => {
      console.log(`[SLOTS API]   - Booking ${apt.id}: ${apt.appointmentTime} (Status: ${apt.status}, Duration: ${apt.estimatedDuration} min)`)
    })

    // Markiere bereits gebuchte Slots als nicht verfügbar (berücksichtige Dauer)
    existingAppointments.forEach(apt => {
      const [startHour, startMinute] = apt.appointmentTime.split(':').map(Number)
      const duration = apt.estimatedDuration || 60 // Default 60 minutes
      const endMinutes = startHour * 60 + startMinute + duration
      const endHour = Math.floor(endMinutes / 60)
      const endMinute = endMinutes % 60
      
      // Block all slots that would conflict with this booking
      slots.forEach(slot => {
        const slotHour = parseInt(slot.time.split(':')[0])
        const slotMinute = parseInt(slot.time.split(':')[1])
        const slotMinutes = slotHour * 60 + slotMinute
        const startMinutes = startHour * 60 + startMinute
        const bookingEndMinutes = endMinutes
        
        // Block if slot starts within the booking period
        if (slotMinutes >= startMinutes && slotMinutes < bookingEndMinutes) {
          slot.available = false
          console.log(`[SLOTS API]   - Blocked ${slot.time} (DB booking, ${apt.appointmentTime}-${endHour}:${String(endMinute).padStart(2, '0')})`)
        }
      })
    })
    
    // 2. Prüfe Google Calendar Events (falls Kalender verbunden)
    let googleCalendarId: string | null = null
    let googleAccessToken: string | null = null
    let googleRefreshToken: string | null = null
    
    // Workshop-Kalender oder Mitarbeiter-Kalender?
    if (workshop.calendarMode === 'workshop' && workshop.googleCalendarId) {
      googleCalendarId = workshop.googleCalendarId
      googleAccessToken = workshop.googleAccessToken
      googleRefreshToken = workshop.googleRefreshToken
      console.log(`[SLOTS API] Using WORKSHOP Google Calendar: ${googleCalendarId}`)
    } else if (workshop.employees.length > 0) {
      // Nutze den ersten Mitarbeiter mit Google Calendar
      const employeeWithCalendar = workshop.employees.find(e => e.googleCalendarId && e.googleAccessToken)
      if (employeeWithCalendar) {
        googleCalendarId = employeeWithCalendar.googleCalendarId
        googleAccessToken = employeeWithCalendar.googleAccessToken
        googleRefreshToken = employeeWithCalendar.googleRefreshToken
        console.log(`[SLOTS API] Using EMPLOYEE Google Calendar: ${googleCalendarId} (${employeeWithCalendar.name || employeeWithCalendar.email})`)
      }
    }
    
    if (googleCalendarId && googleAccessToken && googleRefreshToken) {
      try {
        const busySlots = await getBusySlots(
          googleAccessToken,
          googleRefreshToken,
          googleCalendarId,
          startDate.toISOString(),
          endDate.toISOString()
        )
        
        console.log(`[SLOTS API] Google Calendar busy slots: ${busySlots.length}`)
        
        // Blockiere Slots die mit Google Calendar Events überschneiden
        busySlots.forEach((busy: any) => {
          // Parse ISO datetime with timezone correctly using Date object
          // busy.start is like "2026-02-19T08:00:00+01:00"
          const busyStartDate = new Date(busy.start)
          const busyEndDate = new Date(busy.end)
          
          // Convert to Berlin timezone to get the correct local time
          const busyStartTime = busyStartDate.toLocaleTimeString('de-DE', { 
            timeZone: 'Europe/Berlin', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }) // "08:00"
          const busyEndTime = busyEndDate.toLocaleTimeString('de-DE', { 
            timeZone: 'Europe/Berlin', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }) // "09:20"
          
          console.log(`[SLOTS API]   - Busy from ${busyStartTime} to ${busyEndTime}`)
          
          // Blockiere alle Slots die mit diesem Termin kollidieren würden
          // Ein Slot ist blockiert, wenn sein Start-Zeitpunkt VOR dem Ende des Termins liegt
          // Beispiel: Termin 08:00-09:20 blockiert 08:00, 08:30 UND 09:00
          // (weil eine Buchung um 09:00 mit dem laufenden Termin bis 09:20 kollidiert)
          const [busyEndHour, busyEndMinute] = busyEndTime.split(':').map(Number)
          
          slots.forEach(slot => {
            const slotHour = parseInt(slot.time.split(':')[0])
            const slotMinute = parseInt(slot.time.split(':')[1])
            
            // Block slot if it starts before the event ends
            if (slot.time >= busyStartTime) {
              // Compare as minutes since midnight for accurate comparison
              const slotMinutes = slotHour * 60 + slotMinute
              const busyEndMinutes = busyEndHour * 60 + busyEndMinute
              
              if (slotMinutes < busyEndMinutes) {
                slot.available = false
                console.log(`[SLOTS API]   - Blocked ${slot.time} (Google Calendar)`)
              }
            }
          })
        })
      } catch (error) {
        console.error('[SLOTS API] Error fetching Google Calendar events:', error)
        // Weiter machen ohne Google Calendar Daten
      }
    } else {
      console.log('[SLOTS API] No Google Calendar connected')
    }

    const availableCount = slots.filter(s => s.available).length
    console.log(`[SLOTS API] Available slots: ${availableCount}/${slots.length}`)

    return NextResponse.json({ slots })
    
  } catch (error) {
    console.error('Error getting available slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der verfügbaren Zeiten' },
      { status: 500 }
    )
  }
}
