import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { reason } = await request.json()
    const appointmentId = params.id

    // Hole Booking mit allen Beziehungen
    const booking = await prisma.booking.findUnique({
      where: { id: appointmentId },
      include: {
        workshop: true,
        employee: true,
        tireRequest: true,
        offer: true,
        customer: {
          include: {
            user: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Termin nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Workshop-Owner
    if (booking.workshop.userId !== session.user.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    // Prüfe ob es ein manueller Termin ist
    let isManualEntry = false
    try {
      if (booking.customerNotes) {
        const customerData = JSON.parse(booking.customerNotes)
        isManualEntry = customerData.manualEntry === true
      }
    } catch {}

    // Lösche Google Calendar Event wenn vorhanden
    if (booking.googleEventId && booking.employee) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + '/api/gcal/callback'
        )

        oauth2Client.setCredentials({
          refresh_token: booking.employee.googleRefreshToken,
          access_token: booking.employee.googleAccessToken,
        })

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        await calendar.events.delete({
          calendarId: booking.employee.googleCalendarId || 'primary',
          eventId: booking.googleEventId,
        })

        console.log('✅ Google Calendar Event deleted:', booking.googleEventId)
      } catch (calError) {
        console.error('❌ Error deleting Google Calendar event:', calError)
        // Fahre trotzdem fort
      }
    }

    if (isManualEntry) {
      // Manueller Termin: Vollständige Löschung
      console.log('🗑️  Deleting manual appointment completely:', appointmentId)
      
      // Lösche in richtiger Reihenfolge (wegen Foreign Keys)
      await prisma.booking.delete({
        where: { id: appointmentId }
      })

      // Lösche Offer
      if (booking.offer) {
        await prisma.offer.delete({
          where: { id: booking.offer.id }
        })
      }

      // Lösche TireRequest
      if (booking.tireRequest) {
        await prisma.tireRequest.delete({
          where: { id: booking.tireRequest.id }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Manueller Termin wurde vollständig gelöscht',
        deleted: true
      })
    } else {
      // Kunden-Termin: Nur Status auf CANCELLED setzen
      console.log('❌ Cancelling customer appointment:', appointmentId)
      
      const updatedBooking = await prisma.booking.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          workshopNotes: reason 
            ? `Stornierungsgrund: ${reason}${booking.workshopNotes ? '\n\n' + booking.workshopNotes : ''}`
            : booking.workshopNotes
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Termin wurde storniert. Das Angebot bleibt bestehen.',
        cancelled: true,
        booking: updatedBooking
      })
    }
    
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Stornieren des Termins' },
      { status: 500 }
    )
  }
}
