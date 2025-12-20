import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const {
      date,
      time,
      customerName,
      customerPhone,
      customerEmail,
      serviceDescription,
      vehicleInfo,
      notes
    } = body

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Datum und Uhrzeit sind erforderlich' },
        { status: 400 }
      )
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

    // Erstelle DateTime für den Termin
    const appointmentDateTime = new Date(`${date}T${time}:00`)
    
    // Prüfe ob bereits ein Termin zu dieser Zeit existiert
    const existingAppointment = await prisma.booking.findFirst({
      where: {
        workshopId: workshop.id,
        appointmentDate: appointmentDateTime,
        appointmentTime: time,
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Zu dieser Zeit ist bereits ein Termin eingetragen' },
        { status: 400 }
      )
    }

    // Bestimme Wochentag
    const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // Finde verfügbare Mitarbeiter
    const availableEmployees = workshop.employees.filter(emp => {
      // workingHours ist ein JSON-String
      if (!emp.workingHours) return false
      const workingHours = typeof emp.workingHours === 'string' 
        ? JSON.parse(emp.workingHours) 
        : emp.workingHours
      const workingHour = workingHours.find((wh: any) => wh.dayOfWeek === dayOfWeek)
      return workingHour && workingHour.isWorking
    })

    if (availableEmployees.length === 0) {
      return NextResponse.json(
        { error: 'Keine Mitarbeiter für diesen Tag verfügbar' },
        { status: 400 }
      )
    }

    // Wähle ersten verfügbaren Mitarbeiter
    const employee = availableEmployees[0]

    // Erstelle Terminbeschreibung für Google Calendar
    let calendarDescription = 'Manuell erstellter Termin\n\n'
    if (customerName) calendarDescription += `Kunde: ${customerName}\n`
    if (customerPhone) calendarDescription += `Telefon: ${customerPhone}\n`
    if (customerEmail) calendarDescription += `E-Mail: ${customerEmail}\n`
    if (serviceDescription) calendarDescription += `\nService: ${serviceDescription}\n`
    if (vehicleInfo) calendarDescription += `Fahrzeug: ${vehicleInfo}\n`
    if (notes) calendarDescription += `\nNotizen: ${notes}\n`

    // Google Calendar Event erstellen (wenn Mitarbeiter Calendar hat)
    let googleEventId = null
    if (employee.googleCalendarId && employee.googleRefreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + '/api/gcal/callback'
        )

        oauth2Client.setCredentials({
          refresh_token: employee.googleRefreshToken,
          access_token: employee.googleAccessToken,
        })

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        // Berechne End-Zeit (z.B. 1 Stunde später)
        const [hours, minutes] = time.split(':').map(Number)
        const endDateTime = new Date(appointmentDateTime)
        endDateTime.setHours(hours + 1, minutes, 0)

        const event = await calendar.events.insert({
          calendarId: employee.googleCalendarId,
          requestBody: {
            summary: customerName || 'Werkstatt-Termin',
            description: calendarDescription,
            start: {
              dateTime: appointmentDateTime.toISOString(),
              timeZone: 'Europe/Berlin',
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'Europe/Berlin',
            },
          },
        })

        googleEventId = event.data.id || null
        console.log('✅ Google Calendar Event created:', googleEventId)
      } catch (calError) {
        console.error('❌ Error creating Google Calendar event:', calError)
        // Fahre trotzdem fort, auch wenn Google Calendar fehlschlägt
      }
    }

    // Erstelle Booking in der Datenbank
    const booking = await prisma.booking.create({
      data: {
        workshopId: workshop.id,
        appointmentDate: appointmentDateTime,
        appointmentTime: time,
        status: 'CONFIRMED',
        employeeId: employee.id,
        googleEventId: googleEventId,
        // Speichere zusätzliche Infos in notes oder erstelle neue Felder
        notes: JSON.stringify({
          manualEntry: true,
          customerName,
          customerPhone,
          customerEmail,
          serviceDescription,
          vehicleInfo,
          internalNotes: notes
        })
      },
      include: {
        workshop: {
          include: {
            user: true
          }
        },
        employee: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        date: date,
        time: time,
        googleEventId: googleEventId
      }
    })
    
  } catch (error) {
    console.error('Error creating manual appointment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Termins' },
      { status: 500 }
    )
  }
}
