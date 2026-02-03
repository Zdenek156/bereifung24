import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    let dayWorkingHours: { from: string; to: string; working: boolean } | null = null
    
    // OPTION 1: Werkstatt-Kalender (calendarMode = "workshop")
    if (workshop.calendarMode === 'workshop' && workshop.openingHours) {
      console.log('[SLOTS API] Using WORKSHOP calendar mode')
      
      try {
        const openingHours = typeof workshop.openingHours === 'string' 
          ? JSON.parse(workshop.openingHours) 
          : workshop.openingHours
        
        // openingHours Format: { monday: { from: '08:00', to: '17:00', working: true }, ... }
        dayWorkingHours = openingHours[dayOfWeek]
        console.log(`[SLOTS API] Workshop opening hours for ${dayOfWeek}:`, dayWorkingHours)
      } catch (e) {
        console.error('[SLOTS API] Failed to parse workshop openingHours:', e)
      }
    }
    
    // OPTION 2: Mitarbeiter-Kalender (calendarMode = "employees" ODER kein Workshop-Kalender)
    if (!dayWorkingHours || !dayWorkingHours.working) {
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
    
    if (!dayWorkingHours || !dayWorkingHours.working) {
      console.log('[SLOTS API] Not working on this day (neither workshop nor employees)')
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

    // Prüfe bestehende Termine für dieses Datum
    const existingAppointments = await prisma.booking.findMany({
      where: {
        workshopId: workshop.id,
        appointmentDate: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    console.log(`[SLOTS API] Existing appointments: ${existingAppointments.length}`)

    // Markiere bereits gebuchte Slots als nicht verfügbar
    existingAppointments.forEach(apt => {
      const time = apt.appointmentTime
      const slot = slots.find(s => s.time === time)
      if (slot) {
        slot.available = false
      }
    })

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
