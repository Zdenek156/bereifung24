import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, createICSFile, directBookingConfirmationCustomerEmail, directBookingNotificationWorkshopEmail } from '@/lib/email'
import { createCalendarEvent, refreshAccessToken } from '@/lib/google-calendar'
import { createBerlinDate, isDSTInBerlin } from '@/lib/timezone-utils'
import { autoOrderTires } from '@/lib/services/autoOrderService'

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
    
    console.log('[DIRECT BOOKING] Full Request Body:', JSON.stringify(body, null, 2))
    
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
      reservationId, // Add reservationId to identify the DirectBooking to update
      // Tire information from homepage selection
      tireBrand,
      tireModel,
      tireSize,
      tireLoadIndex,
      tireSpeedIndex,
      tireEAN,
      tireArticleId,
      tireQuantity,
      tirePurchasePrice,
      totalTirePurchasePrice,
      tireRunFlat,
      tire3PMSF,
      // Mixed tires (Mischbereifung)
      tireBrandFront,
      tireModelFront,
      tireSizeFront,
      tireBrandRear,
      tireModelRear,
      tireSizeRear,
      hasMixedTires
    } = body

    console.log('[DIRECT BOOKING] Creating booking:', { workshopId, vehicleId, serviceType, date, time, paymentMethod, reservationId })
    console.log('[DIRECT BOOKING] Tire Data:', { tireBrand, tireModel, tireSize, hasMixedTires, tireBrandFront, tireBrandRear })

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

    let estimatedDuration = 60 // Default, will be overridden by stored durationMinutes from DB

    // Check if slot is still available in DirectBooking (double-check to prevent race conditions)
    const dateOnly = date // Already in YYYY-MM-DD format
    const existingDirectBookings = await prisma.directBooking.findMany({
      where: {
        workshopId,
        date: new Date(`${dateOnly}T00:00:00Z`), // Parse as UTC midnight (same as reservation API)
        time,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        // Exclude the current reservation if updating an existing one
        NOT: reservationId ? { id: reservationId } : undefined
      }
    })

    if (existingDirectBookings.length > 0) {
      return NextResponse.json(
        { error: 'Dieser Termin wurde bereits von einem anderen Kunden gebucht. Bitte wählen Sie einen anderen Termin.' },
        { status: 409 }
      )
    }

    // Update DirectBooking from RESERVED to CONFIRMED (or create new if no reservationId)
    let directBooking: any
    
    if (reservationId) {
      // Load existing reservation WITH ALL DATA including tire data
      const existingReservation = await prisma.directBooking.findUnique({
        where: { id: reservationId }
      })
      
      if (!existingReservation) {
        return NextResponse.json(
          { error: 'Reservierung nicht gefunden' },
          { status: 404 }
        )
      }
      
      const reservationTotal = Number(existingReservation.totalPrice)
      const platformCommissionRate = 0.069 // 6.9%
      const platformCommission = reservationTotal * platformCommissionRate
      const workshopPayout = reservationTotal - platformCommission
      
      console.log('[DIRECT BOOKING] Updating reservation with tire data:', {
        hasTireBrand: !!existingReservation.tireBrand,
        tireBrand: existingReservation.tireBrand,
        tireModel: existingReservation.tireModel,
        tireEAN: existingReservation.tireEAN,
        tireData: existingReservation.tireData,
        tireDataType: typeof existingReservation.tireData,
        hasTireData: !!existingReservation.tireData
      })
      
      // Update existing reservation - KEEP all tire data from reservation!
      directBooking = await prisma.directBooking.update({
        where: { id: reservationId },
        data: {
          status: 'CONFIRMED',
          paymentMethod: paymentMethod || 'STRIPE',
          paymentStatus: paymentStatus || 'PAID',
          paymentId: body.paymentId,
          stripeSessionId: paymentMethod === 'STRIPE' ? body.paymentId : null,
          paypalOrderId: paymentMethod === 'PAYPAL' ? body.paymentId : null,
          platformCommission: platformCommission,
          workshopPayout: workshopPayout,
          paidAt: new Date()
          // DON'T update tire data - reservation already has it!
          // Tire data stays from the original reservation
        }
      })
      
      console.log('[DIRECT BOOKING] Reservation updated to CONFIRMED, tire data preserved')
    } else {
      // No reservation - create new booking with tire data from request body
      if (tireBrand) {
        console.log('[DIRECT BOOKING] Creating new booking with tire data from request:', {
          tireBrand,
          tireModel,
          tireEAN
        })
      }
      
      // Calculate platform commission and workshop payout
      const platformCommissionRate = 0.069 // 6.9%
      const platformCommission = totalPrice * platformCommissionRate
      const workshopPayout = totalPrice - platformCommission
      
      // Create new DirectBooking
      directBooking = await prisma.directBooking.create({
        data: {
          customerId: customer.user.id,
          workshopId,
          vehicleId,
          serviceType,
          date: new Date(`${dateOnly}T00:00:00Z`), // Parse as UTC midnight (same as reservation API)
          time,
          durationMinutes: estimatedDuration,
          basePrice: totalPrice,
          totalPrice: totalPrice,
          platformCommission: platformCommission,
          workshopPayout: workshopPayout,
          status: 'CONFIRMED',
          paymentMethod: paymentMethod || 'STRIPE',
          paymentStatus: paymentStatus || 'PAID',
          paymentId: body.paymentId,
          stripeSessionId: paymentMethod === 'STRIPE' ? body.paymentId : null,
          paypalOrderId: paymentMethod === 'PAYPAL' ? body.paymentId : null,
          paidAt: new Date(),
          // Include tire information if provided
          tireBrand: tireBrand || null,
          tireModel: tireModel || null,
          tireSize: tireSize || null,
          tireLoadIndex: tireLoadIndex || null,
          tireSpeedIndex: tireSpeedIndex || null,
          tireEAN: tireEAN || null,
          tireArticleId: tireArticleId || null,
          tireQuantity: tireQuantity || null,
          tirePurchasePrice: tirePurchasePrice ? Number(tirePurchasePrice) : null,
          totalTirePurchasePrice: totalTirePurchasePrice ? Number(totalTirePurchasePrice) : null,
          tireRunFlat: tireRunFlat || false,
          tire3PMSF: tire3PMSF || false
        }
      })
      console.log('[DIRECT BOOKING] New booking created:', directBooking.id, 'Workshop payout:', workshopPayout.toFixed(2))
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

    // Use stored durationMinutes from DB (set by reserve route with correct base + additionalServices)
    if (completeBooking.durationMinutes && completeBooking.durationMinutes > 0) {
      estimatedDuration = completeBooking.durationMinutes
    } else {
      // Fallback: recalculate from additional services
      const additionalSvcs = (completeBooking as any).additionalServicesData as any[] | null
      if (additionalSvcs && Array.isArray(additionalSvcs)) {
        for (const svc of additionalSvcs) {
          estimatedDuration += (svc.duration || 0)
        }
      }
    }

    console.log('[DIRECT BOOKING] Complete booking loaded with tire data:', {
      id: completeBooking.id,
      estimatedDuration,
      hasTireData: !!(completeBooking.tireBrand && completeBooking.tireModel),
      tireData: completeBooking.tireData,
      tireDataType: typeof completeBooking.tireData,
      isMixedTires: completeBooking.tireData ? (completeBooking.tireData as any)?.isMixedTires : false
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
    
    // Create appointment time in Berlin timezone using centralized timezone utility
    // Handles DST (Daylight Saving Time) automatically with precise last-Sunday-of-March/October logic
    const appointmentDateTime = createBerlinDate(year, month, day, hours, minutes)
    const isDST = isDSTInBerlin(year, month, day)
    const berlinOffset = isDST ? '+02:00' : '+01:00'
    const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00${berlinOffset}`
    
    console.log('[DIRECT BOOKING] Appointment datetime:', {
      stored_date: bookingDate.toISOString(),
      time: directBooking.time,
      extracted_date: `${year}-${month}-${day}`,
      isDST,
      berlinOffset,
      combined_utc: appointmentDateTime.toISOString(),
      berlin_display: appointmentDateTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    })

    let calendarEventId: string | null = null

    // Look up storage info if this booking references stored tires
    let fromStorageBookingId: string | null = (completeBooking as any).fromStorageBookingId || null
    let storageLocationFromStorage: string | null = null
    if (fromStorageBookingId) {
      try {
        const storageBooking = await prisma.directBooking.findUnique({
          where: { id: fromStorageBookingId },
          select: { storageLocation: true }
        })
        storageLocationFromStorage = (storageBooking as any)?.storageLocation || null
        console.log('[DIRECT BOOKING] Storage info:', { fromStorageBookingId, storageLocationFromStorage })
      } catch (e) {
        console.error('[DIRECT BOOKING] Failed to look up storage booking:', e)
      }
    }

    // Build serviceName (needed in calendar, emails, AND response)
    const globalServiceLabels: Record<string, string> = {
      'WHEEL_CHANGE': 'Räderwechsel',
      'TIRE_CHANGE': 'Reifenwechsel',
      'TIRE_REPAIR': 'Reifenreparatur',
      'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
      'ALIGNMENT_BOTH': 'Achsvermessung',
      'CLIMATE_SERVICE': 'Klimaservice'
    }
    const globalSubtypeLabels: Record<string, string> = {
      'foreign_object': 'Fremdkörper-Entfernung',
      'valve_damage': 'Ventilschaden',
      'basic': 'Basis',
      'comfort': 'Komfort',
      'premium': 'Premium',
      'check': 'Prüfung',
      'front': 'Vorderachse',
      'rear': 'Hinterachse',
      'both': 'Beide Achsen',
      'measurement_front': 'Vermessung Vorderachse',
      'measurement_rear': 'Vermessung Hinterachse',
      'measurement_both': 'Vermessung beide Achsen',
      'adjustment_front': 'Einstellung Vorderachse',
      'adjustment_rear': 'Einstellung Hinterachse',
      'adjustment_both': 'Einstellung beide Achsen',
      'full_service': 'Komplett-Service'
    }
    const globalBookingSubtype = (completeBooking as any).serviceSubtype
    const globalSubtypeLabel = globalBookingSubtype ? globalSubtypeLabels[globalBookingSubtype] : null
    const serviceName = globalSubtypeLabel
      ? `${globalServiceLabels[serviceType] || serviceType} - ${globalSubtypeLabel}`
      : (globalServiceLabels[serviceType] || serviceType)

    // Create Google Calendar Event if requested
    if (shouldCreateCalendarEvent) {
      console.log('[CALENDAR] Creating Google Calendar event...')
      
      const appointmentStart = appointmentDateTime
      const appointmentEnd = new Date(appointmentStart.getTime() + estimatedDuration * 60000)

      const serviceLabels: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel',
        'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_REPAIR': 'Reifenreparatur',
        'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
        'ALIGNMENT_BOTH': 'Achsvermessung',
        'CLIMATE_SERVICE': 'Klimaservice'
      }

      // Build detailed service name using subtype (e.g. "Reifenreparatur - Fremdkörper-Entfernung")
      const subtypeLabels: Record<string, string> = {
        'foreign_object': 'Fremdkörper-Entfernung',
        'valve_damage': 'Ventilschaden',
        'basic': 'Basis',
        'comfort': 'Komfort',
        'premium': 'Premium',
        'check': 'Prüfung',
        'front': 'Vorderachse',
        'rear': 'Hinterachse',
        'both': 'Beide Achsen',
        'measurement_front': 'Vermessung Vorderachse',
        'measurement_rear': 'Vermessung Hinterachse',
        'measurement_both': 'Vermessung beide Achsen',
        'adjustment_front': 'Einstellung Vorderachse',
        'adjustment_rear': 'Einstellung Hinterachse',
        'adjustment_both': 'Einstellung beide Achsen',
        'full_service': 'Komplett-Service'
      }
      const bookingSubtype = (completeBooking as any).serviceSubtype
      const subtypeLabel = bookingSubtype ? subtypeLabels[bookingSubtype] : null
      // Use global serviceName (already defined above)
      const customerInfo = `${customer.user.firstName} ${customer.user.lastName}\n${customer.user.email}\nTelefon: ${customer.user.phone || 'Nicht angegeben'}`
      const vehicleInfo = `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}${vehicle.licensePlate ? ` - ${vehicle.licensePlate}` : ''}`
      
      // Helper: construct tire size string from tireData fields
      const buildTireSizeStr = (td: any) => {
        if (!td) return ''
        // Use size as-is if available (it may already include loadIndex+speedIndex)
        if (td.size) return td.size
        // Fallback to loadIndex+speedIndex if no size
        return `${td.loadIndex || ''}${td.speedIndex || ''}`
      }

      // Build detailed description with tire info if available
      let calendarDescription = `${customerInfo}\n\nFahrzeug: ${vehicleInfo}\nService: ${serviceName}`
      
      // Add storage info if customer has stored tires
      if (fromStorageBookingId) {
        calendarDescription += `\n\n📦 REIFEN AUS EINLAGERUNG - Bitte bereitstellen!`
        if (storageLocationFromStorage) {
          calendarDescription += `\n📍 Lagerort: ${storageLocationFromStorage}`
        }
      }
      
      const tireDataJson = completeBooking.tireData as any
      if (tireDataJson?.isMixedTires && tireDataJson.front && tireDataJson.rear) {
        // Mixed tires (motorcycle front/rear)
        calendarDescription += `\n\n🛞 Reifen Vorne: ${tireDataJson.front.brand} ${tireDataJson.front.model}`
        const frontSize = buildTireSizeStr(tireDataJson.front)
        if (frontSize) calendarDescription += ` (${frontSize})`
        calendarDescription += ` - ${tireDataJson.front.quantity || 1}x`
        if (tireDataJson.front.ean) calendarDescription += `\nEAN: ${tireDataJson.front.ean}`
        
        calendarDescription += `\n\n🛞 Reifen Hinten: ${tireDataJson.rear.brand} ${tireDataJson.rear.model}`
        const rearSize = buildTireSizeStr(tireDataJson.rear)
        if (rearSize) calendarDescription += ` (${rearSize})`
        calendarDescription += ` - ${tireDataJson.rear.quantity || 1}x`
        if (tireDataJson.rear.ean) calendarDescription += `\nEAN: ${tireDataJson.rear.ean}`
      } else if (completeBooking.tireBrand && completeBooking.tireModel) {
        calendarDescription += `\n\n🛞 Reifen: ${completeBooking.tireBrand} ${completeBooking.tireModel}`
        if (completeBooking.tireSize) calendarDescription += ` ${completeBooking.tireSize}`
        if (completeBooking.tireLoadIndex || completeBooking.tireSpeedIndex) calendarDescription += ` ${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`
        calendarDescription += ` (${completeBooking.tireQuantity || 4}x)`
        if (completeBooking.tireEAN) calendarDescription += `\nEAN: ${completeBooking.tireEAN}`
      }
      
      // Add additional services (standard: balancing, storage, disposal)
      if (completeBooking.hasBalancing || completeBooking.hasStorage || completeBooking.hasWashing || completeBooking.hasDisposal || completeBooking.runFlatSurcharge) {
        calendarDescription += `\n\nZusatzleistungen:`
        if (completeBooking.hasBalancing) calendarDescription += `\n✅ Auswuchtung (+${Number(completeBooking.balancingPrice || 0).toFixed(2)}€)`
        if (completeBooking.hasStorage) calendarDescription += `\n✅ Einlagerung (+${Number(completeBooking.storagePrice || 0).toFixed(2)}€)`
        if (completeBooking.hasWashing) calendarDescription += `\n✅ Räder waschen (+${Number(completeBooking.washingPrice || 0).toFixed(2)}€)`
        if (completeBooking.hasDisposal && (completeBooking.serviceType === 'TIRE_CHANGE' || completeBooking.serviceType === 'MOTORCYCLE_TIRE')) calendarDescription += `\n✅ Reifenentsorgung (+${Number(completeBooking.disposalFee || 0).toFixed(2)}€)`
        if (completeBooking.runFlatSurcharge && Number(completeBooking.runFlatSurcharge) > 0) calendarDescription += `\n✅ RunFlat-Aufschlag (+${Number(completeBooking.runFlatSurcharge).toFixed(2)}€)`
      }
      
      // Add custom additional services (Klimaservice, Achsvermessung, etc.)
      const additionalServicesJson = (completeBooking as any).additionalServicesData as any[] | null
      if (additionalServicesJson && additionalServicesJson.length > 0) {
        if (!completeBooking.hasBalancing && !completeBooking.hasStorage && !completeBooking.hasDisposal) {
          calendarDescription += `\n\nZusatzleistungen:`
        }
        for (const svc of additionalServicesJson) {
          const rawName = (svc.name || '').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
          const svcName = svc.packageName ? `${rawName} (${svc.packageName})` : rawName
          calendarDescription += `\n✅ ${svcName} (+${Number(svc.price || 0).toFixed(2)}€)`
        }
      }
      
      calendarDescription += `\n\nGesamtpreis: ${Number(completeBooking.totalPrice || 0).toFixed(2)} €`
      
      const eventDetails = {
        summary: `${serviceName}${tireDataJson?.isMixedTires ? ` - ${tireDataJson.front?.brand || ''} / ${tireDataJson.rear?.brand || ''}` : completeBooking.tireBrand ? ` - ${completeBooking.tireBrand}` : ''}${fromStorageBookingId ? ' 📦 Einlagerung' : ''}`,
        description: calendarDescription,
        start: appointmentStart.toISOString(),
        end: appointmentEnd.toISOString(),
        attendees: [{ email: customer.user.email }]
      }

      // Try workshop calendar first, then fallback to employee calendar
      let calAccessToken: string | null = null
      let calRefreshToken: string | null = null
      let calCalendarId: string | null = null
      let calSource = ''

      if (workshop.googleAccessToken && workshop.googleRefreshToken && workshop.googleCalendarId) {
        calAccessToken = workshop.googleAccessToken
        calRefreshToken = workshop.googleRefreshToken
        calCalendarId = workshop.googleCalendarId
        calSource = 'workshop'
        console.log('[CALENDAR] Using WORKSHOP Google Calendar')
      } else {
        // Fallback: find first employee with connected Google Calendar
        const empWithCal = await prisma.employee.findFirst({
          where: {
            workshopId,
            googleCalendarId: { not: null },
            googleAccessToken: { not: null },
            googleRefreshToken: { not: null },
          },
          select: { id: true, name: true, googleCalendarId: true, googleAccessToken: true, googleRefreshToken: true }
        })
        if (empWithCal) {
          calAccessToken = empWithCal.googleAccessToken
          calRefreshToken = empWithCal.googleRefreshToken
          calCalendarId = empWithCal.googleCalendarId
          calSource = `employee:${empWithCal.name}`
          console.log(`[CALENDAR] Using EMPLOYEE Google Calendar: ${empWithCal.name}`)
        }
      }

      if (calAccessToken && calRefreshToken && calCalendarId) {
        try {
          let accessToken = calAccessToken

          // Refresh token
          try {
            const newTokens = await refreshAccessToken(calRefreshToken)
            if (newTokens.access_token) {
              accessToken = newTokens.access_token
            }
          } catch (refreshErr) {
            console.warn('[CALENDAR] Token refresh failed, trying with existing token:', refreshErr instanceof Error ? refreshErr.message : refreshErr)
          }

          const calendarEvent = await createCalendarEvent(
            accessToken,
            calRefreshToken,
            calCalendarId,
            eventDetails
          )

          calendarEventId = calendarEvent.id || null
          
          if (calendarEventId) {
            console.log(`[CALENDAR] Event created in ${calSource} calendar:`, calendarEventId)
          }
        } catch (error) {
          console.error(`[CALENDAR] Failed to create ${calSource} calendar event:`, error)
        }
      } else {
        console.log('[CALENDAR] No Google Calendar connected (workshop or employee)')
      }
    }

    // === AUTO-ORDER: Try to order tires automatically if workshop has autoOrder enabled ===
    let autoOrderResult: { success: boolean; orderNumber?: string; error?: string } | null = null
    const isTireServiceType = ['TIRE_CHANGE', 'TIRE_MOUNT', 'MOTORCYCLE_TIRE'].includes(serviceType)
    const hasTirePurchase = !!(completeBooking.tireBrand || (completeBooking.tireData as any)?.isMixedTires)
    
    if (isTireServiceType && hasTirePurchase) {
      console.log('[AUTO-ORDER] Checking auto-order for tire service booking...')
      try {
        autoOrderResult = await autoOrderTires(completeBooking.id)
        console.log('[AUTO-ORDER] Result:', JSON.stringify(autoOrderResult))
      } catch (error) {
        console.error('[AUTO-ORDER] Error:', error)
        autoOrderResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    // === Look up workshop supplier config from WorkshopSupplier table ===
    const workshopSupplier = await prisma.workshopSupplier.findFirst({
      where: {
        workshopId: completeBooking.workshopId,
        isActive: true,
      },
      select: {
        supplier: true,
        name: true,
        connectionType: true,
        autoOrder: true,
      }
    })
    console.log('[SUPPLIER] Workshop supplier config:', workshopSupplier)

    // Send emails if requested
    if (sendEmails) {
      console.log('[EMAIL] Sending confirmation emails...')

      const serviceLabels: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel',
        'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_REPAIR': 'Reifenreparatur',
        'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
        'ALIGNMENT_BOTH': 'Achsvermessung',
        'CLIMATE_SERVICE': 'Klimaservice'
      }

      // Build detailed service name using subtype
      const emailSubtypeLabels: Record<string, string> = {
        'foreign_object': 'Fremdkörper-Entfernung',
        'valve_damage': 'Ventilschaden',
        'basic': 'Basis',
        'comfort': 'Komfort',
        'premium': 'Premium',
        'check': 'Prüfung',
        'front': 'Vorderachse',
        'rear': 'Hinterachse',
        'both': 'Beide Achsen',
        'measurement_front': 'Vermessung Vorderachse',
        'measurement_rear': 'Vermessung Hinterachse',
        'measurement_both': 'Vermessung beide Achsen',
        'adjustment_front': 'Einstellung Vorderachse',
        'adjustment_rear': 'Einstellung Hinterachse',
        'adjustment_both': 'Einstellung beide Achsen',
        'full_service': 'Komplett-Service'
      }
      const emailBookingSubtype = (completeBooking as any).serviceSubtype
      const emailSubtypeLabel = emailBookingSubtype ? emailSubtypeLabels[emailBookingSubtype] : null
      // Use global serviceName (already defined above)
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
      let icsDescriptionParts = [
        `${serviceName} bei ${completeBooking.workshop.companyName}`,
        '',
        `📅 Termin: ${formattedDate} um ${completeBooking.time} Uhr`,
        `⏱️ Dauer: ca. ${estimatedDuration} Minuten`,
        `🚗 Fahrzeug: ${vehicleStr}`,
      ]
      
      // Add tire info if available
      const icsTireData = completeBooking.tireData as any
      if (icsTireData?.isMixedTires && icsTireData.front && icsTireData.rear) {
        // Mixed tires (motorcycle front/rear)
        icsDescriptionParts.push('')
        icsDescriptionParts.push(`🛞 Reifen Vorne: ${icsTireData.front.brand} ${icsTireData.front.model}`)
        const frontSizeIcs = icsTireData.front.size || `${icsTireData.front.loadIndex || ''}${icsTireData.front.speedIndex || ''}`
        if (frontSizeIcs) icsDescriptionParts.push(`Größe: ${frontSizeIcs}`)
        icsDescriptionParts.push(`Menge: ${icsTireData.front.quantity || 1}x`)
        if (icsTireData.front.ean) icsDescriptionParts.push(`EAN: ${icsTireData.front.ean}`)
        
        icsDescriptionParts.push('')
        icsDescriptionParts.push(`🛞 Reifen Hinten: ${icsTireData.rear.brand} ${icsTireData.rear.model}`)
        const rearSizeIcs = icsTireData.rear.size || `${icsTireData.rear.loadIndex || ''}${icsTireData.rear.speedIndex || ''}`
        if (rearSizeIcs) icsDescriptionParts.push(`Größe: ${rearSizeIcs}`)
        icsDescriptionParts.push(`Menge: ${icsTireData.rear.quantity || 1}x`)
        if (icsTireData.rear.ean) icsDescriptionParts.push(`EAN: ${icsTireData.rear.ean}`)
      } else if (completeBooking.tireBrand && completeBooking.tireModel) {
        icsDescriptionParts.push('')
        icsDescriptionParts.push(`🛞 Reifen: ${completeBooking.tireBrand} ${completeBooking.tireModel}`)
        const stdSize = completeBooking.tireSize || `${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`
        if (stdSize) icsDescriptionParts.push(`Größe: ${stdSize}`)
        icsDescriptionParts.push(`Menge: ${completeBooking.tireQuantity || 4}x`)
        if (completeBooking.tireEAN) icsDescriptionParts.push(`EAN: ${completeBooking.tireEAN}`)
      }
      
      // Add additional services to ICS
      const showDisposalInIcs = completeBooking.hasDisposal && (completeBooking.serviceType === 'TIRE_CHANGE' || completeBooking.serviceType === 'MOTORCYCLE_TIRE')
      if (completeBooking.hasBalancing || completeBooking.hasStorage || showDisposalInIcs || completeBooking.runFlatSurcharge) {
        icsDescriptionParts.push('')
        icsDescriptionParts.push('Zusatzleistungen:')
        if (completeBooking.hasBalancing) icsDescriptionParts.push(`✅ Auswuchtung (+${Number(completeBooking.balancingPrice || 0).toFixed(2)}€)`)
        if (completeBooking.hasStorage) icsDescriptionParts.push(`✅ Einlagerung (+${Number(completeBooking.storagePrice || 0).toFixed(2)}€)`)
        if (showDisposalInIcs) icsDescriptionParts.push(`✅ Reifenentsorgung (+${Number(completeBooking.disposalFee || 0).toFixed(2)}€)`)
        if (completeBooking.runFlatSurcharge && Number(completeBooking.runFlatSurcharge) > 0) {
          icsDescriptionParts.push(`✅ RunFlat-Aufschlag (+${Number(completeBooking.runFlatSurcharge).toFixed(2)}€)`)
        }
      }
      
      // Add custom additional services (Klimaservice, Achsvermessung, etc.) to ICS
      const icsAdditionalServices = (completeBooking as any).additionalServicesData as any[] | null
      if (icsAdditionalServices && icsAdditionalServices.length > 0) {
        if (!completeBooking.hasBalancing && !completeBooking.hasStorage && !completeBooking.hasDisposal) {
          icsDescriptionParts.push('')
          icsDescriptionParts.push('Zusatzleistungen:')
        }
        for (const svc of icsAdditionalServices) {
          const rawName = (svc.name || '').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
          const svcName = svc.packageName ? `${rawName} (${svc.packageName})` : rawName
          icsDescriptionParts.push(`✅ ${svcName} (+${Number(svc.price || 0).toFixed(2)}€)`)
        }
      }
      
      icsDescriptionParts.push('')
      icsDescriptionParts.push(`💰 Gesamtpreis: ${Number(completeBooking.totalPrice).toFixed(2)} €`)
      icsDescriptionParts.push('')
      icsDescriptionParts.push(`📍 Adresse:`)
      icsDescriptionParts.push(`${completeBooking.workshop.companyName}`)
      icsDescriptionParts.push(workshopAddress)
      icsDescriptionParts.push('')
      icsDescriptionParts.push(`📞 Kontakt: ${completeBooking.workshop.user.phone || completeBooking.workshop.user.email}`)
      
      const icsDescription = icsDescriptionParts.join('\\n')
      
      // Log for debugging
      console.log('[ICS GENERATION]', {
        berlinTime: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        isDST,
        offset: berlinOffset,
        utcStart: appointmentStart.toISOString(),
        utcEnd: appointmentEnd.toISOString()
      })
      
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

      // Extract pricing details (use 0 instead of undefined to avoid .toFixed() errors in email templates)
      const basePrice = completeBooking.basePrice ? Number(completeBooking.basePrice) : 0
      const balancingPrice = completeBooking.balancingPrice ? Number(completeBooking.balancingPrice) : 0
      const storagePrice = completeBooking.storagePrice ? Number(completeBooking.storagePrice) : 0
      const disposalFee = completeBooking.disposalFee ? Number(completeBooking.disposalFee) : 0
      const runFlatSurcharge = completeBooking.runFlatSurcharge ? Number(completeBooking.runFlatSurcharge) : 0
      const totalPrice = completeBooking.totalPrice ? Number(completeBooking.totalPrice) : 0

      // Tire data for emails - include loadIndex/speedIndex if not already in tireSize
      const rawTireSize = completeBooking.tireSize || ''
      const loadSpeedSuffix = `${completeBooking.tireLoadIndex || ''}${completeBooking.tireSpeedIndex || ''}`
      const sizeAlreadyHasLoadSpeed = loadSpeedSuffix && rawTireSize.includes(loadSpeedSuffix)
      const tireSize = rawTireSize
        ? (sizeAlreadyHasLoadSpeed ? rawTireSize : `${rawTireSize} ${loadSpeedSuffix}`.trim())
        : (loadSpeedSuffix || undefined)

      // Send customer email with rich tire data
      const customerEmailData = directBookingConfirmationCustomerEmail({
        bookingId: completeBooking.id,
        customerName: `${completeBooking.customer.user.firstName} ${completeBooking.customer.user.lastName}`,
        workshopName: completeBooking.workshop.companyName,
        workshopAddress,
        workshopPhone: completeBooking.workshop.user.phone || 'Nicht angegeben',
        workshopEmail: completeBooking.workshop.user.email,
        workshopLogoUrl: completeBooking.workshop.logoUrl 
          ? (completeBooking.workshop.logoUrl.startsWith('http') 
              ? completeBooking.workshop.logoUrl 
              : `${process.env.NEXTAUTH_URL || 'https://bereifung24.de'}${completeBooking.workshop.logoUrl}`)
          : undefined,
        serviceType: serviceType as any,
        serviceName,
        appointmentDate: formattedDate,
        appointmentTime: completeBooking.time,
        durationMinutes: estimatedDuration,
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
        tirePurchasePrice: completeBooking.tirePurchasePrice ? Number(completeBooking.tirePurchasePrice) : undefined,
        totalTirePurchasePrice: completeBooking.totalTirePurchasePrice ? Number(completeBooking.totalTirePurchasePrice) : undefined,
        tireRunFlat: completeBooking.tireRunFlat || undefined,
        tire3PMSF: completeBooking.tire3PMSF || undefined,
        tireData: completeBooking.tireData as any, // Mixed tires data
        hasBalancing: completeBooking.hasBalancing || undefined,
        hasStorage: completeBooking.hasStorage || undefined,
        hasWashing: completeBooking.hasWashing || undefined,
        washingPrice: completeBooking.washingPrice ? Number(completeBooking.washingPrice) : undefined,
        hasDisposal: (completeBooking.hasDisposal && (completeBooking.serviceType === 'TIRE_CHANGE' || completeBooking.serviceType === 'MOTORCYCLE_TIRE')) || undefined,
        additionalServicesData: (completeBooking as any).additionalServicesData || undefined
      })

      console.log('[DIRECT BOOKING] Customer email data prepared:', {
        hasTireData: !!customerEmailData,
        tireDataInEmail: (customerEmailData as any).tireData,
        isMixedInEmail: (customerEmailData as any).tireData?.isMixedTires
      })

      try {
        await sendEmail({
          to: completeBooking.customer.user.email,
          subject: customerEmailData.subject,
          html: customerEmailData.html,
          // Add ICS as attachment for calendar import
          attachments: icsContent ? [{
            filename: 'termin.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }] : []
        })
        console.log('[EMAIL] Customer email sent to:', completeBooking.customer.user.email)
      } catch (error) {
        console.error('[EMAIL] Failed to send customer email:', error)
      }

      // Send workshop email with tire ordering instructions
      const customerInvoiceAddress = completeBooking.customer.user.street 
        ? `${completeBooking.customer.user.street}, ${completeBooking.customer.user.zipCode} ${completeBooking.customer.user.city}`
        : undefined

      console.log('[EMAIL] Tire data for workshop email:', {
        tireBrand: completeBooking.tireBrand,
        tireModel: completeBooking.tireModel,
        tireArticleId: completeBooking.tireArticleId,
        tireEAN: completeBooking.tireEAN,
        supplierName: workshopSupplier?.name,
        supplierConnectionType: workshopSupplier?.connectionType,
        autoOrder: workshopSupplier?.autoOrder,
        autoOrderResult: autoOrderResult,
        hasTireArticleId: !!completeBooking.tireArticleId
      })
      const workshopEmailData = directBookingNotificationWorkshopEmail({
        bookingId: completeBooking.id,
        workshopName: completeBooking.workshop.companyName,
        customerName: `${completeBooking.customer.user.firstName} ${completeBooking.customer.user.lastName}`,
        customerEmail: completeBooking.customer.user.email,
        customerPhone: completeBooking.customer.user.phone || 'Nicht angegeben',
        customerInvoiceAddress: customerInvoiceAddress,
        serviceType: serviceType as any,
        serviceName,
        appointmentDate: formattedDate,
        appointmentTime: completeBooking.time,
        durationMinutes: estimatedDuration,
        vehicleBrand: completeBooking.vehicle.make,
        vehicleModel: completeBooking.vehicle.model,
        vehicleYear: completeBooking.vehicle.year || undefined,
        vehicleLicensePlate: completeBooking.vehicle.licensePlate || undefined,
        basePrice: completeBooking.basePrice ? Number(completeBooking.basePrice) : 0,
        balancingPrice: completeBooking.balancingPrice ? Number(completeBooking.balancingPrice) : undefined,
        storagePrice: completeBooking.storagePrice ? Number(completeBooking.storagePrice) : undefined,
        disposalFee: completeBooking.disposalFee ? Number(completeBooking.disposalFee) : undefined,
        runFlatSurcharge: completeBooking.runFlatSurcharge ? Number(completeBooking.runFlatSurcharge) : undefined,
        totalPrice,
        platformCommission: completeBooking.platformCommission ? Number(completeBooking.platformCommission) : 0,
        workshopPayout: completeBooking.workshopPayout ? Number(completeBooking.workshopPayout) : totalPrice,
        hasBalancing: completeBooking.hasBalancing || undefined,
        hasStorage: completeBooking.hasStorage || undefined,
        hasWashing: completeBooking.hasWashing || undefined,
        washingPrice: completeBooking.washingPrice ? Number(completeBooking.washingPrice) : undefined,
        hasDisposal: (completeBooking.hasDisposal && (completeBooking.serviceType === 'TIRE_CHANGE' || completeBooking.serviceType === 'MOTORCYCLE_TIRE')) || undefined,
        tireBrand: completeBooking.tireBrand || undefined,
        tireModel: completeBooking.tireModel || undefined,
        tireSize,
        tireQuantity: completeBooking.tireQuantity || undefined,
        tireEAN: completeBooking.tireEAN || undefined,
        tireArticleId: completeBooking.tireArticleId || undefined,
        tirePurchasePrice: completeBooking.tirePurchasePrice ? Number(completeBooking.tirePurchasePrice) : undefined,
        totalPurchasePrice: completeBooking.totalTirePurchasePrice ? Number(completeBooking.totalTirePurchasePrice) : undefined,
        tireRunFlat: completeBooking.tireRunFlat || undefined,
        tire3PMSF: completeBooking.tire3PMSF || undefined,
        tireData: completeBooking.tireData as any,
        supplierConnectionType: workshopSupplier?.connectionType as 'API' | 'CSV' | undefined,
        supplierName: workshopSupplier?.name,
        autoOrderSuccess: autoOrderResult?.success || false,
        autoOrderNumber: autoOrderResult?.orderNumber,
        autoOrderError: autoOrderResult?.error,
        additionalServicesData: (completeBooking as any).additionalServicesData || undefined,
        fromStorageBookingId: fromStorageBookingId || undefined,
        storageLocationFromStorage: storageLocationFromStorage || undefined
      })

      console.log('[DIRECT BOOKING] Workshop email data prepared:', {
        tireDataInEmail: (workshopEmailData as any).tireData,
        isMixedInEmail: (workshopEmailData as any).tireData?.isMixedTires,
        tireBrand: (workshopEmailData as any).tireBrand,
        tireEAN: (workshopEmailData as any).tireEAN
      })

      try {
        await sendEmail({
          to: completeBooking.workshop.user.email,
          subject: workshopEmailData.subject,
          html: workshopEmailData.html,
          // Workshop email does not need ICS attachment (only customer email has it)
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
        // Mixed tire data (JSON field with front/rear details)
        tireData: completeBooking.tireData || null,
        // Pricing details
        basePrice: completeBooking.basePrice,
        balancingPrice: completeBooking.balancingPrice,
        storagePrice: completeBooking.storagePrice,
        disposalFee: completeBooking.disposalFee,
        runFlatSurcharge: completeBooking.runFlatSurcharge,
        washingPrice: completeBooking.washingPrice ? Number(completeBooking.washingPrice) : null,
        totalPrice: completeBooking.totalPrice,
        // Boolean flags for add-on services
        hasBalancing: completeBooking.hasBalancing || false,
        hasStorage: completeBooking.hasStorage || false,
        hasWashing: completeBooking.hasWashing || false,
        hasDisposal: completeBooking.hasDisposal || false,
        // Additional services data
        additionalServicesData: (completeBooking as any).additionalServicesData || null,
        serviceSubtype: (completeBooking as any).serviceSubtype || null,
        // Service labels for display
        serviceName: serviceName
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
