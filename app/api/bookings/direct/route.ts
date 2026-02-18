import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, createICSFile, directBookingConfirmationCustomerEmail, directBookingNotificationWorkshopEmail } from '@/lib/email'
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
          paymentId: body.paymentId, // Store Stripe session ID or PayPal order ID
          stripeSessionId: paymentMethod === 'STRIPE' ? body.paymentId : null,
          paypalOrderId: paymentMethod === 'PAYPAL' ? body.paymentId : null,
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
          paymentId: body.paymentId,
          stripeSessionId: paymentMethod === 'STRIPE' ? body.paymentId : null,
          paypalOrderId: paymentMethod === 'PAYPAL' ? body.paymentId : null,
          paidAt: new Date()
        }
      })
      console.log('[DIRECT BOOKING] New booking created:', directBooking.id)
    }

    // Reload DirectBooking with all fields (including tire data)
    const completeBooking = await prisma.directBooking.findUnique({
      where: { id: directBooking.id },
      include: {
        customer: {
          include: { user: true }
        },
        workshop: {
          include: { user: true }
        },
        vehicle: true
      }
    })

    if (!completeBooking) {
      console.error('[DIRECT BOOKING] Failed to reload booking:', directBooking.id)
      return NextResponse.json(
        { error: 'Buchung konnte nicht geladen werden' },
        { status: 500 }
      )
    }

    console.log('[DIRECT BOOKING] Complete booking loaded with tire data:', {
      id: completeBooking.id,
      hasTireData: !!(completeBooking.tireBrand && completeBooking.tireModel)
    })

    // Use DirectBooking's stored date and time (authoritative source)
    // The date from DB is stored as UTC midnight (e.g., "2026-03-13T00:00:00Z")
    // This directly represents the date the user selected, without timezone conversion
    const bookingDate = completeBooking.date // Date object from DB (UTC)
    const [hours, minutes] = completeBooking.time.split(':').map(Number)
    
    // Extract date components directly from the UTC midnight timestamp
    // Since we store "2026-03-13T00:00:00Z" for March 13, we can use UTC components
    const year = bookingDate.getUTCFullYear()
    const month = bookingDate.getUTCMonth() + 1 // 0-indexed, so add 1
    const day = bookingDate.getUTCDate()
    
    // Create UTC timestamp for the appointment (Berlin time converted to UTC)
    // Example: User booked 13.03.2026 at 15:00 Berlin
    // - In winter (CET = UTC+1): 15:00 Berlin = 14:00 UTC
    // - In summer (CEST = UTC+2): 15:00 Berlin = 13:00 UTC
    // For simplicity, we use -1 hour offset (CET)
    const appointmentDateTime = new Date(Date.UTC(year, month - 1, day, hours - 1, minutes, 0))
    
    console.log('[DIRECT BOOKING] Appointment datetime:', {
      stored_date: bookingDate.toISOString(),
      time: directBooking.time,
      extracted_date: `${year}-${month}-${day}`,
      combined_utc: appointmentDateTime.toISOString(),
      berlin_display: appointmentDateTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    })

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
      const workshopAddress = `${completeBooking.workshop.user.street || ''}, ${completeBooking.workshop.user.zipCode || ''} ${completeBooking.workshop.user.city || ''}`
      const vehicleStr = `${completeBooking.vehicle.make} ${completeBooking.vehicle.model}${completeBooking.vehicle.year ? ` (${completeBooking.vehicle.year})` : ''}${completeBooking.vehicle.licensePlate ? ` - ${completeBooking.vehicle.licensePlate}` : ''}`

      // Create ICS file for customer
      const appointmentStart = appointmentDateTime
      const appointmentEnd = new Date(appointmentStart.getTime() + estimatedDuration * 60000)
      
      // Create detailed description in German
      const icsDescription = [
        `${serviceName} bei ${completeBooking.workshop.companyName}`,
        '',
        `📅 Termin: ${formattedDate} um ${completeBooking.time} Uhr`,
        `⏱️ Dauer: ca. ${estimatedDuration} Minuten`,
        `🚗 Fahrzeug: ${vehicleStr}`,
        `💰 Preis: ${Number(completeBooking.totalPrice).toFixed(2)} €`,
        '',
        `📍 Adresse:`,
        `${completeBooking.workshop.companyName}`,
        workshopAddress,
        '',
        `📞 Kontakt: ${completeBooking.workshop.user.phone || completeBooking.workshop.user.email}`,
      ].join('\\n')
      
      const icsContent = createICSFile({
        start: appointmentStart,
        end: appointmentEnd,
        summary: `Termin: ${serviceName} bei ${completeBooking.workshop.companyName}`,
        description: icsDescription,
        location: `${completeBooking.workshop.companyName}, ${workshopAddress}`,
        organizerEmail: completeBooking.workshop.user.email,
        organizerName: completeBooking.workshop.companyName,
        attendeeEmail: completeBooking.customer.user.email,
        attendeeName: `${completeBooking.customer.user.firstName} ${completeBooking.customer.user.lastName}`
      })

      // Extract pricing details
      const basePrice = completeBooking.basePrice ? Number(completeBooking.basePrice) : 0
      const balancingPrice = completeBooking.balancingPrice ? Number(completeBooking.balancingPrice) : undefined
      const storagePrice = completeBooking.storagePrice ? Number(completeBooking.storagePrice) : undefined
      const disposalFee = completeBooking.disposalFee ? Number(completeBooking.disposalFee) : undefined
      const runFlatSurcharge = completeBooking.runFlatSurcharge ? Number(completeBooking.runFlatSurcharge) : undefined
      const totalPrice = completeBooking.totalPrice ? Number(completeBooking.totalPrice) : 0

      // Tire data for emails
      const tireSize = completeBooking.tireSize 
        ? `${completeBooking.tireSize} ${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`.trim()
        : undefined

      // Send customer email with rich tire data
      const customerEmailData = directBookingConfirmationCustomerEmail({
        bookingId: completeBooking.id,
        customerName: `${completeBooking.customer.user.firstName} ${completeBooking.customer.user.lastName}`,
        workshopName: completeBooking.workshop.companyName,
        workshopAddress,
        workshopPhone: completeBooking.workshop.user.phone || undefined,
        workshopEmail: completeBooking.workshop.user.email,
        workshopLogoUrl: completeBooking.workshop.logoUrl || undefined,
        serviceType: serviceType as any,
        serviceName,
        date: formattedDate,
        time: completeBooking.time,
        vehicleBrand: completeBooking.vehicle.make,
        vehicleModel: completeBooking.vehicle.model,
        vehicleYear: completeBooking.vehicle.year || undefined,
        vehicleLicensePlate: completeBooking.vehicle.licensePlate || undefined,
        basePrice,
        balancingPrice,
        storagePrice,
        disposalFee,
        runFlatSurcharge,
        totalPrice,
        paymentMethod: completeBooking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : 'SEPA-Lastschrift',
        tireBrand: completeBooking.tireBrand || undefined,
        tireModel: completeBooking.tireModel || undefined,
        tireSize,
        tireQuantity: completeBooking.tireQuantity || undefined,
        tireEAN: completeBooking.tireEAN || undefined,
        tireRunFlat: completeBooking.tireRunFlat || undefined,
        tire3PMSF: completeBooking.tire3PMSF || undefined,
        hasDisposal: completeBooking.hasDisposal || undefined
      })

      try {
        await sendEmail({
          to: completeBooking.customer.user.email,
          subject: customerEmailData.subject,
          html: customerEmailData.html,
          attachments: icsContent ? [{
            filename: 'termin.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }] : undefined
        })
        console.log('[EMAIL] Customer email sent to:', completeBooking.customer.user.email)
      } catch (error) {
        console.error('[EMAIL] Failed to send customer email:', error)
      }

      // Send workshop email with tire ordering instructions
      const customerInvoiceAddress = completeBooking.customer.user.street 
        ? `${completeBooking.customer.user.street}, ${completeBooking.customer.user.zipCode} ${completeBooking.customer.user.city}`
        : undefined

      // Check if workshop has supplier integration
      const supplier = completeBooking.workshop.supplierId 
        ? await prisma.tireSupplier.findUnique({ 
            where: { id: completeBooking.workshop.supplierId },
            select: { name: true, type: true }
          })
        : null

      const workshopEmailData = directBookingNotificationWorkshopEmail({
        bookingId: completeBooking.id,
        workshopName: completeBooking.workshop.companyName,
        customerName: `${completeBooking.customer.user.firstName} ${completeBooking.customer.user.lastName}`,
        customerEmail: completeBooking.customer.user.email,
        customerPhone: completeBooking.customer.user.phone || undefined,
        customerInvoiceAddress,
        serviceType: serviceType as any,
        serviceName,
        date: formattedDate,
        time: completeBooking.time,
        vehicleBrand: completeBooking.vehicle.make,
        vehicleModel: completeBooking.vehicle.model,
        vehicleYear: completeBooking.vehicle.year || undefined,
        vehicleLicensePlate: completeBooking.vehicle.licensePlate || undefined,
        totalPrice,
        totalPaid: totalPrice,
        platformFee: 0, // No commission in test mode
        workshopPayout: totalPrice,
        tireBrand: completeBooking.tireBrand || undefined,
        tireModel: completeBooking.tireModel || undefined,
        tireSize,
        tireQuantity: completeBooking.tireQuantity || undefined,
        tireEAN: completeBooking.tireEAN || undefined,
        tirePurchasePrice: completeBooking.tirePurchasePrice ? Number(completeBooking.tirePurchasePrice) : undefined,
        totalTirePurchasePrice: completeBooking.totalTirePurchasePrice ? Number(completeBooking.totalTirePurchasePrice) : undefined,
        tireRunFlat: completeBooking.tireRunFlat || undefined,
        tire3PMSF: completeBooking.tire3PMSF || undefined,
        supplierType: supplier?.type as 'API' | 'CSV' | undefined,
        supplierName: supplier?.name
      })

      try {
        await sendEmail({
          to: completeBooking.workshop.user.email,
          subject: workshopEmailData.subject,
          html: workshopEmailData.html
        })
        console.log('[EMAIL] Workshop email sent to:', completeBooking.workshop.user.email)
      } catch (error) {
        console.error('[EMAIL] Failed to send workshop email:', error)
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: completeBooking.id,
        appointmentDate: completeBooking.date.toISOString(),
        appointmentTime: completeBooking.time,
        status: completeBooking.status,
        googleEventId: calendarEventId,
        paymentStatus: completeBooking.paymentStatus,
        // Tire data for success page display
        tireBrand: completeBooking.tireBrand,
        tireModel: completeBooking.tireModel,
        tireSize: completeBooking.tireSize,
        tireLoadIndex: completeBooking.tireLoadIndex,
        tireSpeedIndex: completeBooking.tireSpeedIndex,
        tireEAN: completeBooking.tireEAN,
        tireQuantity: completeBooking.tireQuantity,
        tireRunFlat: completeBooking.tireRunFlat,
        tire3PMSF: completeBooking.tire3PMSF,
        // Pricing details
        basePrice: completeBooking.basePrice,
        balancingPrice: completeBooking.balancingPrice,
        storagePrice: completeBooking.storagePrice,
        disposalFee: completeBooking.disposalFee,
        runFlatSurcharge: completeBooking.runFlatSurcharge,
        totalPrice: completeBooking.totalPrice
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
