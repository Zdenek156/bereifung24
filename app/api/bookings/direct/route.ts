import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, createICSFile } from '@/lib/email'
import { createCalendarEvent, refreshAccessToken } from '@/lib/google-calendar'

/**
 * POST /api/bookings/direct
 * Create a direct booking after payment (new flow without tire request/offer)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const body = await req.json()
    const {
      workshopId,
      vehicleId,
      serviceType,
      date,
      time,
      paymentMethod,
      paymentStatus,
      sendEmails = false,
      createCalendarEvent: shouldCreateCalendarEvent = false,
      reservationId // Add reservationId to identify the DirectBooking to update
    } = body

    console.log('[DIRECT BOOKING] Creating booking:', { workshopId, vehicleId, serviceType, date, time, paymentMethod, reservationId })

    // Validate required fields
    if (!workshopId || !vehicleId || !serviceType || !date || !time) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    // Get workshop
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { user: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    // Get vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle || vehicle.customerId !== customer.id) {
      return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 })
    }

    // Get service pricing
    const pricingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workshop/${workshopId}/services/${serviceType}`)
    let totalPrice = 0
    if (pricingResponse.ok) {
      const pricingData = await pricingResponse.json()
      totalPrice = pricingData.price || pricingData.basePrice || 0
    }

    // Parse date and time
    // Create date object that represents the exact time in Europe/Berlin timezone
    // date format: "2026-02-19", time format: "10:00"
    const appointmentDateTime = new Date(`${date}T${time}:00+01:00`) // Force Europe/Berlin timezone (UTC+1)
    const estimatedDuration = 60 // Default 60 minutes

    // Check if slot is still available in DirectBooking (double-check to prevent race conditions)
    const dateOnly = date // Already in YYYY-MM-DD format
    const existingDirectBookings = await prisma.directBooking.findMany({
      where: {
        workshopId,
        date: new Date(`${dateOnly}T00:00:00+01:00`), // Parse in Europe/Berlin timezone
        time,
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    })

    if (existingDirectBookings.length > 0) {
      return NextResponse.json(
        { error: 'Dieser Termin wurde bereits gebucht. Bitte wählen Sie einen anderen Termin.' },
        { status: 409 }
      )
    }

    // Update DirectBooking from RESERVED to CONFIRMED (or create new if no reservationId)
    let directBooking: any
    
    if (reservationId) {
      // Update existing reservation
      directBooking = await prisma.directBooking.update({
        where: { id: reservationId },
        data: {
          status: 'CONFIRMED',
          paymentMethod: paymentMethod || 'STRIPE',
          paymentStatus: paymentStatus || 'PAID',
          paidAt: new Date()
        }
      })
      console.log('[DIRECT BOOKING] Reservation confirmed:', directBooking.id)
    } else {
      // Create new DirectBooking
      directBooking = await prisma.directBooking.create({
        data: {
          customerId: customer.user.id,
          workshopId,
          vehicleId,
          serviceType,
          date: new Date(`${dateOnly}T00:00:00+01:00`), // Parse in Europe/Berlin timezone
          time,
          durationMinutes: estimatedDuration,
          basePrice: totalPrice,
          totalPrice: totalPrice,
          status: 'CONFIRMED',
          paymentMethod: paymentMethod || 'STRIPE',
          paymentStatus: paymentStatus || 'PAID',
          paidAt: new Date()
        }
      })
      console.log('[DIRECT BOOKING] New booking created:', directBooking.id)
    }


    let calendarEventId: string | null = null

    // Create Google Calendar Event if requested
    if (shouldCreateCalendarEvent) {
      console.log('[CALENDAR] Creating Google Calendar event...')
      
      const appointmentStart = appointmentDateTime
      const appointmentEnd = new Date(appointmentStart.getTime() + estimatedDuration * 60000)

      const serviceLabels: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel',
        'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_REPAIR': 'Reifenreparatur',
        'MOTORCYCLE_TIRE': 'Motorradreifen',
        'ALIGNMENT_BOTH': 'Achsvermessung + Einstellung',
        'CLIMATE_SERVICE': 'Klimaservice'
      }

      const serviceName = serviceLabels[serviceType] || serviceType
      const customerInfo = `${customer.user.firstName} ${customer.user.lastName}\n${customer.user.email}\nTelefon: ${customer.user.phone || 'Nicht angegeben'}`
      const vehicleInfo = `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}${vehicle.licensePlate ? ` - ${vehicle.licensePlate}` : ''}`
      
      const eventDetails = {
        summary: serviceName,
        description: `${customerInfo}\n\nFahrzeug: ${vehicleInfo}\nService: ${serviceName}\nPreis: ${totalPrice.toFixed(2)} €`,
        start: appointmentStart.toISOString(),
        end: appointmentEnd.toISOString(),
        attendees: [{ email: customer.user.email }]
      }

      // Try workshop calendar first
      if (workshop.googleAccessToken && workshop.googleRefreshToken && workshop.googleCalendarId) {
        try {
          let accessToken = workshop.googleAccessToken

          // Refresh token if expired
          if (!accessToken || (workshop.googleTokenExpiry && new Date() > workshop.googleTokenExpiry)) {
            console.log('[CALENDAR] Refreshing workshop token...')
            const newTokens = await refreshAccessToken(workshop.googleRefreshToken)
            accessToken = newTokens.access_token || accessToken

            await prisma.workshop.update({
              where: { id: workshopId },
              data: {
                googleAccessToken: accessToken,
                googleTokenExpiry: new Date(newTokens.expiry_date || Date.now() + 3600 * 1000)
              }
            })
          }

          const calendarEvent = await createCalendarEvent(
            accessToken,
            workshop.googleRefreshToken,
            workshop.googleCalendarId,
            eventDetails
          )

          calendarEventId = calendarEvent.id || null
          
          if (calendarEventId) {
            // Store calendar event ID in DirectBooking (we don't have a field for it yet, so skip for now)
            // TODO: Add googleEventId field to DirectBooking model
            console.log('[CALENDAR] Event created in workshop calendar:', calendarEventId)
          }
        } catch (error) {
          console.error('[CALENDAR] Failed to create workshop calendar event:', error)
        }
      } else {
        console.log('[CALENDAR] Workshop calendar not connected')
      }
    }

    // Send emails if requested
    if (sendEmails) {
      console.log('[EMAIL] Sending confirmation emails...')

      const serviceLabels: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel',
        'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_REPAIR': 'Reifenreparatur',
        'MOTORCYCLE_TIRE': 'Motorradreifen',
        'ALIGNMENT_BOTH': 'Achsvermessung + Einstellung',
        'CLIMATE_SERVICE': 'Klimaservice'
      }

      const serviceName = serviceLabels[serviceType] || serviceType
      const formattedDate = appointmentDateTime.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const workshopAddress = `${workshop.user.street || ''}, ${workshop.user.zipCode || ''} ${workshop.user.city || ''}`
      const vehicleStr = `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}${vehicle.licensePlate ? ` - ${vehicle.licensePlate}` : ''}`
      const priceStr = `${totalPrice.toFixed(2)} €`

      // Get email templates
      const customerTemplate = await prisma.emailTemplate.findUnique({
        where: { key: 'BOOKING_CONFIRMATION_CUSTOMER' }
      })

      const workshopTemplate = await prisma.emailTemplate.findUnique({
        where: { key: 'BOOKING_CONFIRMATION_WORKSHOP' }
      })

      // Create ICS file for customer
      const appointmentStart = appointmentDateTime
      const appointmentEnd = new Date(appointmentStart.getTime() + estimatedDuration * 60000)
      
      // Create detailed description in German
      const icsDescription = [
        `${serviceName} bei ${workshop.companyName}`,
        '',
        `📅 Termin: ${formattedDate} um ${time} Uhr`,
        `⏱️ Dauer: ca. ${estimatedDuration} Minuten`,
        `🚗 Fahrzeug: ${vehicleStr}`,
        `💰 Preis: ${priceStr}`,
        '',
        `📍 Adresse:`,
        `${workshop.companyName}`,
        workshopAddress,
        '',
        `📞 Kontakt: ${workshop.user.phone || workshop.user.email}`,
      ].join('\\n')
      
      const icsContent = createICSFile({
        start: appointmentStart,
        end: appointmentEnd,
        summary: `Termin: ${serviceName} bei ${workshop.companyName}`,
        description: icsDescription,
        location: `${workshop.companyName}, ${workshopAddress}`,
        organizerEmail: workshop.user.email,
        organizerName: workshop.companyName,
        attendeeEmail: customer.user.email,
        attendeeName: `${customer.user.firstName} ${customer.user.lastName}`
      })

      // Send to customer with ICS attachment
      if (customerTemplate) {
        const customerHtml = customerTemplate.htmlContent
          .replace(/{{customerName}}/g, `${customer.user.firstName} ${customer.user.lastName}`)
          .replace(/{{workshopName}}/g, workshop.companyName)
          .replace(/{{workshopAddress}}/g, workshopAddress)
          .replace(/{{serviceName}}/g, serviceName)
          .replace(/{{date}}/g, formattedDate)
          .replace(/{{time}}/g, time)
          .replace(/{{vehicle}}/g, vehicleStr)
          .replace(/{{price}}/g, priceStr)
          .replace(/{{dashboardUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/bookings`)
          .replace(/{{workshopPhone}}/g, workshop.user.phone || 'Nicht angegeben')
          .replace(/{{workshopEmail}}/g, workshop.user.email)

        try {
          await sendEmail({
            to: customer.user.email,
            subject: customerTemplate.subject.replace(/{{workshopName}}/g, workshop.companyName),
            html: customerHtml,
            attachments: [{
              filename: 'termin.ics',
              content: icsContent,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST'
            }]
          })
          console.log('[EMAIL] Customer email sent to:', customer.user.email)
        } catch (error) {
          console.error('[EMAIL] Failed to send customer email:', error)
        }
      }

      // Send to workshop
      if (workshopTemplate) {
        const workshopHtml = workshopTemplate.htmlContent
          .replace(/{{workshopName}}/g, workshop.companyName)
          .replace(/{{customerName}}/g, `${customer.user.firstName} ${customer.user.lastName}`)
          .replace(/{{customerEmail}}/g, customer.user.email)
          .replace(/{{customerPhone}}/g, customer.user.phone || 'Nicht angegeben')
          .replace(/{{serviceName}}/g, serviceName)
          .replace(/{{date}}/g, formattedDate)
          .replace(/{{time}}/g, time)
          .replace(/{{vehicle}}/g, vehicleStr)
          .replace(/{{licensePlate}}/g, vehicle.licensePlate || 'Nicht angegeben')
          .replace(/{{price}}/g, priceStr)
          .replace(/{{dashboardUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workshop/appointments`)

        try {
          await sendEmail({
            to: workshop.user.email,
            subject: workshopTemplate.subject
              .replace(/{{serviceName}}/g, serviceName)
              .replace(/{{date}}/g, formattedDate),
            html: workshopHtml
          })
          console.log('[EMAIL] Workshop email sent to:', workshop.user.email)
        } catch (error) {
          console.error('[EMAIL] Failed to send workshop email:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: directBooking.id,
        appointmentDate: directBooking.date.toISOString(),
        appointmentTime: directBooking.time,
        status: directBooking.status,
        googleEventId: calendarEventId,
        paymentStatus: directBooking.paymentStatus
      }
    })

  } catch (error) {
    console.error('[DIRECT BOOKING] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Buchung', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
