import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { sendTemplateEmail, replacePlaceholders } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { reason, reasonType } = await request.json()
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

    // Beide Termintypen: Status auf CANCELLED setzen
    console.log('❌ Cancelling appointment:', appointmentId, 'Manual:', isManualEntry)
    
    const notePrefix = isManualEntry 
      ? 'Manueller Termin storniert'
      : 'Kunden-Termin storniert'
    
    // Übersetze Stornierungsgrund
    const reasonTypeLabels: Record<string, string> = {
      'customer_cancelled': 'Kunde hat abgesagt',
      'workshop_unavailable': 'Werkstatt nicht verfügbar',
      'technical_issue': 'Technisches Problem',
      'parts_unavailable': 'Fahrzeugteile nicht verfügbar',
      'reschedule_needed': 'Neuer Termin erforderlich',
      'other': 'Sonstiges'
    }
    
    const reasonLabel = reasonType ? reasonTypeLabels[reasonType] || reasonType : ''
    const fullReason = reasonLabel + (reason ? `: ${reason}` : '')
    
    const updatedBooking = await prisma.booking.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        workshopNotes: fullReason 
          ? `${notePrefix} - ${fullReason}${booking.workshopNotes ? '\n\n' + booking.workshopNotes : ''}`
          : `${notePrefix}${booking.workshopNotes ? '\n\n' + booking.workshopNotes : ''}`
      }
    })

    // Reset TireRequest status so customer can rebook (but keep Offer as ACCEPTED)
    if (!isManualEntry && booking.tireRequest) {
      try {
        // Set TireRequest back to QUOTED (customer can choose new date/time)
        await prisma.tireRequest.update({
          where: { id: booking.tireRequestId },
          data: {
            status: 'QUOTED'
          }
        })

        console.log('✅ Reset TireRequest status to QUOTED for rebooking')
        // NOTE: We keep the Offer status as ACCEPTED so customer can directly rebook
        // without having to accept the offer again
      } catch (resetError) {
        console.error('❌ Error resetting request status:', resetError)
        // Continue anyway - cancellation should succeed even if status reset fails
      }
    }

    // Sende Email an Kunden bei Kunden-Terminen
    if (!isManualEntry && booking.customer && booking.customer.user.email) {
      try {
        const appointmentDate = new Date(booking.appointmentDate).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        // Template-Daten vorbereiten
        const templateData = {
          customerFirstName: booking.customer.user.firstName,
          customerLastName: booking.customer.user.lastName,
          workshopName: booking.workshop.name,
          appointmentDate,
          appointmentTime: booking.appointmentTime,
          reasonLabel,
          additionalMessageBlock: reason 
            ? `<p style="margin: 5px 0;"><strong>Nachricht:</strong> ${reason}</p>` 
            : '',
          rescheduleMessage: reasonType === 'reschedule_needed'
            ? '<p>Bitte kontaktieren Sie die Werkstatt, um einen neuen Termin zu vereinbaren.</p>'
            : '<p>Bei Fragen können Sie sich gerne an die Werkstatt wenden.</p>',
          workshopContactInfo: [
            booking.workshop.phone ? `<p>Tel: ${booking.workshop.phone}</p>` : '',
            booking.workshop.email ? `<p>Email: ${booking.workshop.email}</p>` : ''
          ].filter(Boolean).join('\n')
        }

        // Verwende Template-System (mit Fallback)
        await sendTemplateEmail(
          'appointment_cancelled',
          booking.customer.user.email,
          templateData,
          undefined, // keine Anhänge
          {
            // Fallback falls Template nicht in DB vorhanden
            subject: `Termin storniert - ${booking.workshop.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Terminabsage</h2>
                <p>Sehr geehrte/r ${booking.customer.user.firstName} ${booking.customer.user.lastName},</p>
                
                <p>leider muss Ihr Termin bei <strong>${booking.workshop.name}</strong> storniert werden.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Termin:</strong> ${appointmentDate}, ${booking.appointmentTime} Uhr</p>
                  <p style="margin: 5px 0;"><strong>Grund:</strong> ${reasonLabel}</p>
                  ${reason ? `<p style="margin: 5px 0;"><strong>Nachricht:</strong> ${reason}</p>` : ''}
                </div>

                <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold; color: #1e40af;">✓ Sie können jetzt einen neuen Termin buchen</p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e3a8a;">
                    Ihr Termin wurde erfolgreich storniert. Sie können jetzt in Ihrem Dashboard einen neuen Wunschtermin auswählen.
                  </p>
                  <a href="https://bereifung24.de/dashboard/customer/requests" 
                     style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Zum Dashboard
                  </a>
                </div>

                ${reasonType === 'reschedule_needed' ? `
                  <p>Falls Sie Fragen haben, können Sie sich gerne direkt an die Werkstatt wenden.</p>
                ` : `
                  <p>Bei Fragen können Sie sich gerne an die Werkstatt wenden.</p>
                `}
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 5px 0; font-weight: bold; font-size: 16px;">${booking.workshop.name}</p>
                  ${booking.workshop.phone ? `<p style="margin: 5px 0;">📞 Tel: ${booking.workshop.phone}</p>` : ''}
                  ${booking.workshop.email ? `<p style="margin: 5px 0;">📧 Email: ${booking.workshop.email}</p>` : ''}
                </div>

                <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                  Mit freundlichen Grüßen<br/>
                  Ihr Bereifung24 Team
                </p>
              </div>
            `
          }
        )

        console.log('✅ Cancellation email sent to customer:', booking.customer.user.email)
      } catch (emailError) {
        console.error('❌ Error sending cancellation email:', emailError)
        // Fahre trotzdem fort - Email-Fehler soll nicht die Stornierung blockieren
      }
    }

    return NextResponse.json({
      success: true,
      message: isManualEntry 
        ? 'Manueller Termin wurde storniert'
        : 'Kunden-Termin wurde storniert. Der Kunde wurde per Email benachrichtigt.',
      cancelled: true,
      booking: updatedBooking
    })
    
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Stornieren des Termins' },
      { status: 500 }
    )
  }
}
