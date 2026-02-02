import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Verfügbare Zeitslots für ein bestimmtes Datum abrufen
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Datum erforderlich' }, { status: 400 })
    }

    // Hole Workshop-Daten
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
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

    // Bestimme Wochentag
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
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

    if (availableEmployees.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Hole Arbeitszeiten des ersten verfügbaren Mitarbeiters (der mit Google Calendar verbunden ist)
    const employee = availableEmployees.find(emp => emp.googleCalendarId && emp.googleRefreshToken) || availableEmployees[0]
    
    const workingHours = typeof employee.workingHours === 'string' 
      ? JSON.parse(employee.workingHours) 
      : employee.workingHours
    
    const dayWorkingHours = workingHours[dayOfWeek]
    
    if (!dayWorkingHours || !dayWorkingHours.working) {
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

    // Markiere bereits gebuchte Slots als nicht verfügbar
    existingAppointments.forEach(apt => {
      const time = apt.appointmentTime
      const slot = slots.find(s => s.time === time)
      if (slot) {
        slot.available = false
      }
    })

    return NextResponse.json({ slots })
    
  } catch (error) {
    console.error('Error getting available slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der verfügbaren Zeiten' },
      { status: 500 }
    )
  }
}
