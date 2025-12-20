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
          where: { onVacation: false },
          include: {
            vacations: true,
            workingHours: true,
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    // Bestimme Wochentag
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' })
    
    // Sammle alle verfügbaren Mitarbeiter für diesen Tag
    const availableEmployees = workshop.employees.filter(emp => {
      // Prüfe ob Urlaub
      const isOnVacation = emp.vacations.some(v => {
        const start = new Date(v.startDate)
        const end = new Date(v.endDate)
        const checkDate = new Date(date)
        return checkDate >= start && checkDate <= end
      })
      
      if (isOnVacation) return false
      
      // Prüfe Arbeitszeiten
      const workingHour = emp.workingHours.find((wh: any) => wh.dayOfWeek === dayOfWeek)
      return workingHour && workingHour.isWorking
    })

    if (availableEmployees.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Generiere Zeitslots (z.B. alle 30 Minuten von 8:00 bis 18:00)
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          available: true // Vereinfacht - hier könntest du Google Calendar prüfen
        })
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
