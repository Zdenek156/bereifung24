import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/bookings/[id]/calendar - Download .ics file for booking
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Get booking with all details
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        workshop: {
          include: {
            user: true
          }
        },
        tireRequest: true,
        offer: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (booking.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Generate .ics file content
    const appointmentStart = new Date(booking.appointmentDate)
    const appointmentEnd = new Date(appointmentStart.getTime() + (booking.estimatedDuration || 60) * 60000)
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const tireSize = `${booking.tireRequest.width}/${booking.tireRequest.aspectRatio} R${booking.tireRequest.diameter}`
    const workshopAddress = `${booking.workshop.user.street}, ${booking.workshop.user.zipCode} ${booking.workshop.user.city}`

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bereifung24//Booking//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Reifenwechsel
X-WR-TIMEZONE:Europe/Berlin
BEGIN:VEVENT
DTSTART:${formatICSDate(appointmentStart)}
DTEND:${formatICSDate(appointmentEnd)}
DTSTAMP:${formatICSDate(new Date())}
UID:booking-${booking.id}@bereifung24.de
SUMMARY:Reifenwechsel - ${booking.workshop.companyName}
DESCRIPTION:Reifenwechsel bei ${booking.workshop.companyName}\\n\\nReifen: ${booking.offer?.tireBrand || ''} ${booking.offer?.tireModel || ''}\\nGröße: ${tireSize}\\nMenge: ${booking.tireRequest.quantity}\\n\\nWerkstatt:\\n${booking.workshop.companyName}\\n${workshopAddress}\\nTelefon: ${booking.workshop.user.phone || 'Nicht angegeben'}\\n\\nBuchungsnummer: #${booking.id.substring(0, 8).toUpperCase()}${booking.customerNotes ? `\\n\\nIhre Hinweise:\\n${booking.customerNotes}` : ''}
LOCATION:${workshopAddress}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reifenwechsel-Termin morgen
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reifenwechsel-Termin in 1 Stunde
END:VALARM
END:VEVENT
END:VCALENDAR`

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="reifenwechsel-${booking.id.substring(0, 8)}.ics"`
      }
    })

  } catch (error) {
    console.error('Calendar export error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Kalenderdatei' },
      { status: 500 }
    )
  }
}
