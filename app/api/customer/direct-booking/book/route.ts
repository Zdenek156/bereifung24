import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { sendEmail, createICSFile, directBookingConfirmationCustomerEmail, directBookingNotificationWorkshopEmail } from '@/lib/email'
import { createCalendarEvent, refreshAccessToken } from '@/lib/google-calendar'
import { createBerlinDate } from '@/lib/timezone-utils'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * POST /api/customer/direct-booking/book
 * Finalize booking after successful payment
 * 
 * Body:
 * {
 *   reservationId: string,
 *   paymentMethod: 'STRIPE' | 'PAYPAL',
 *   paymentId: string (Stripe payment intent ID or PayPal order ID)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[BOOK API] Starting booking')
    
    // Support both mobile Bearer token and web NextAuth session
    let userId: string | null = null
    let userEmail: string | null = null
    
    const authUser = await getAuthUser(request)
    if (authUser?.id) {
      userId = authUser.id
      userEmail = authUser.email || null
      console.log('[BOOK API] ✅ User authenticated via Bearer token:', userId)
    } else {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        userId = session.user.id
        userEmail = session.user.email || null
        console.log('[BOOK API] ✅ User authenticated via session:', userId)
      }
    }
    
    if (!userId) {
      console.log('[BOOK API] ❌ Not authenticated')
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }
    const body = await request.json()
    console.log('[BOOK API] Request body:', body)

    // Check if this is a direct booking (with PayPal payment)
    if (body.workshopId && body.serviceType && body.vehicleId) {
      // DIRECT BOOKING FLOW with PayPal payment
      console.log('[BOOK API] Direct booking flow with payment')
      
      const { 
        workshopId, 
        serviceType, 
        vehicleId, 
        date, 
        time, 
        hasBalancing, 
        hasStorage, 
        hasWashing,
        basePrice,
        balancingPrice,
        storagePrice,
        washingPrice,
        totalPrice, 
        durationMinutes,
        paymentMethod, 
        paymentId,
        tireBrand,
        tireModel,
        tireArticleNumber,
        tireQuantity,
        tirePricePerUnit,
        tireTotalPrice,
        tireSize,
        tireData,
        serviceSubtype,
        serviceDisplayName,
      } = body
      
      if (!workshopId || !serviceType || !vehicleId || !date || !time || totalPrice === undefined || basePrice === undefined) {
        console.log('[BOOK API] ❌ Missing required booking parameters')
        return NextResponse.json(
          { error: 'Fehlende Buchungsparameter' },
          { status: 400 }
        )
      }

      if (!paymentId || !paymentMethod) {
        console.log('[BOOK API] ❌ Missing payment information')
        return NextResponse.json(
          { error: 'Fehlende Zahlungsinformationen' },
          { status: 400 }
        )
      }

      // Get or create Customer record
      console.log('🔍 [BOOK] Looking for customer, User:', userEmail)
      
      let customer = await prisma.customer.findUnique({
        where: { userId: userId }
      })

      if (!customer) {
        console.log('[BOOK API] Creating new Customer record for user:', userId)
        customer = await prisma.customer.create({
          data: {
            userId: userId
          }
        })
      }

      console.log('✅ [BOOK] Customer found/created:', customer.id)

      // Create booking after successful payment
      console.log('💰 [BOOK] Creating CONFIRMED booking:', { workshop: workshopId, date, totalPrice })
      
      const booking = await prisma.directBooking.create({
        data: {
          workshopId,
          serviceType,
          ...(serviceSubtype ? { serviceSubtype } : {}),
          vehicleId,
          customerId: customer.id,
          date: new Date(date + 'T00:00:00'), // Convert YYYY-MM-DD to Date at midnight
          time,
          hasBalancing: hasBalancing || false,
          hasStorage: hasStorage || false,
          hasWashing: hasWashing || false,
          basePrice: new Decimal(basePrice),
          balancingPrice: balancingPrice ? new Decimal(balancingPrice) : null,
          storagePrice: storagePrice ? new Decimal(storagePrice) : null,
          washingPrice: washingPrice ? new Decimal(washingPrice) : null,
          totalPrice: new Decimal(totalPrice),
          durationMinutes: durationMinutes || 60,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod,
          paymentId: paymentId,
          paidAt: new Date(),
          // Tire data
          ...(tireBrand ? { tireBrand } : {}),
          ...(tireModel ? { tireModel } : {}),
          ...(tireArticleNumber ? { tireArticleId: tireArticleNumber } : {}),
          ...(tireQuantity ? { tireQuantity: Number(tireQuantity) } : {}),
          ...(tirePricePerUnit ? { tirePurchasePrice: new Decimal(tirePricePerUnit) } : {}),
          ...(tireTotalPrice ? { totalTirePurchasePrice: new Decimal(tireTotalPrice) } : {}),
          ...(tireSize ? { tireSize } : {}),
          ...(tireData ? { tireData } : {}),
        },
        include: {
          workshop: { include: { user: true } },
          vehicle: true,
          customer: { include: { user: true } }
        }
      })

      console.log('[BOOK API] ✅ Booking created:', booking.id)

      // Derived fields for convenience
      const customerName = `${booking.customer.user.firstName || ''} ${booking.customer.user.lastName || ''}`.trim() || 'Kunde'
      const customerEmail = booking.customer.user.email
      const customerPhone = booking.customer.user.phone
      const workshopName = booking.workshop.companyName
      const workshopAddress = booking.workshop.user.street || ''
      const workshopZip = booking.workshop.user.zipCode || ''
      const workshopCity = booking.workshop.user.city || ''
      const workshopPhone = booking.workshop.user.phone || ''
      const workshopEmail = booking.workshop.user.email || ''
      const vehicleMake = booking.vehicle.make

      // Create Google Calendar event
      try {
        if (booking.workshop.googleAccessToken && booking.workshop.googleRefreshToken && booking.workshop.googleCalendarId) {
          console.log('[BOOK API] Creating Google Calendar event via OAuth...')
          
          let accessToken = booking.workshop.googleAccessToken

          // Refresh token if expired
          if (!accessToken || (booking.workshop.googleTokenExpiry && new Date() > booking.workshop.googleTokenExpiry)) {
            console.log('[BOOK API] Refreshing workshop Google token...')
            const newTokens = await refreshAccessToken(booking.workshop.googleRefreshToken)
            accessToken = newTokens.access_token || accessToken

            await prisma.workshop.update({
              where: { id: workshopId },
              data: {
                googleAccessToken: accessToken,
                googleTokenExpiry: new Date(newTokens.expiry_date || Date.now() + 3600 * 1000)
              }
            })
          }
          
          const bookingDate = new Date(booking.date)
          const [calHours, calMinutes] = booking.time.split(':').map(Number)
          const startDateTime = createBerlinDate(bookingDate.getUTCFullYear(), bookingDate.getUTCMonth() + 1, bookingDate.getUTCDate(), calHours, calMinutes)
          const endDateTime = new Date(startDateTime.getTime() + booking.durationMinutes * 60000)
          
          const serviceLabels: Record<string, string> = {
            'WHEEL_CHANGE': 'Räderwechsel',
            'TIRE_CHANGE': 'Reifenwechsel',
            'TIRE_REPAIR': 'Reifenreparatur',
            'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
            'ALIGNMENT_BOTH': 'Achsvermessung',
            'CLIMATE_SERVICE': 'Klimaservice'
          }
          
          const calDescription = [
            `${customerName}`,
            `${customerEmail}`,
            `Telefon: ${customerPhone || 'Nicht angegeben'}`,
            '',
            `Fahrzeug: ${vehicleMake} ${booking.vehicle.model}${booking.vehicle.licensePlate ? ` - ${booking.vehicle.licensePlate}` : ''}`,
            `Service: ${serviceDisplayName || serviceLabels[booking.serviceType] || booking.serviceType}`,
          ]
          if (booking.hasBalancing) calDescription.push('✅ Auswuchtung')
          if (booking.hasStorage) calDescription.push('✅ Einlagerung')
          if (booking.hasWashing) calDescription.push('✅ Räder waschen')
          // Add tire info to calendar
          if (tireData?.isMixedTires) {
            calDescription.push('', '🛞 Reifen (Mischbereifung):')
            if (tireData.front) {
              calDescription.push(`VA: ${tireData.front.quantity || 2}× ${tireData.front.brand} ${tireData.front.model}`)
              if (tireData.front.size) calDescription.push(`   Größe: ${tireData.front.size}`)
            }
            if (tireData.rear) {
              calDescription.push(`HA: ${tireData.rear.quantity || 2}× ${tireData.rear.brand} ${tireData.rear.model}`)
              if (tireData.rear.size) calDescription.push(`   Größe: ${tireData.rear.size}`)
            }
          } else if (tireBrand) {
            calDescription.push('', `🛞 Reifen: ${tireQuantity || 4}× ${tireBrand} ${tireModel || ''}`)
            if (tireSize) calDescription.push(`   Größe: ${tireSize}`)
          }
          calDescription.push('', `Gesamtpreis: ${Number(booking.totalPrice).toFixed(2)} €`)
          
          const calSummaryTire = tireData?.isMixedTires
            ? ` - ${tireData.front?.brand || ''} / ${tireData.rear?.brand || ''}`
            : tireBrand ? ` - ${tireBrand}` : ''
          
          await createCalendarEvent(
            accessToken,
            booking.workshop.googleRefreshToken,
            booking.workshop.googleCalendarId,
            {
              summary: `${serviceDisplayName || serviceLabels[booking.serviceType] || booking.serviceType} - ${vehicleMake} ${booking.vehicle.model}${calSummaryTire}`,
              description: calDescription.join('\n'),
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              attendees: [{ email: customerEmail }]
            }
          )
          
          console.log('[BOOK API] ✅ Google Calendar event created')
        } else {
          console.log('[BOOK API] ⏭️ Workshop has no Google Calendar connected')
        }
      } catch (calendarError) {
        console.error('[BOOK API] Error creating calendar event:', calendarError)
      }

      // Send confirmation email to customer (same mechanism as web booking)
      try {
        const formattedDate = new Date(booking.date).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        
        const serviceLabelsEmail: Record<string, string> = {
          'WHEEL_CHANGE': 'Räderwechsel',
          'TIRE_CHANGE': 'Reifenwechsel',
          'TIRE_REPAIR': 'Reifenreparatur',
          'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
          'ALIGNMENT_BOTH': 'Achsvermessung',
          'CLIMATE_SERVICE': 'Klimaservice'
        }
        const serviceName = serviceDisplayName || serviceLabelsEmail[booking.serviceType] || booking.serviceType

        // Generate ICS calendar file
        const icsBookingDate = new Date(booking.date)
        const [icsHours, icsMinutes] = booking.time.split(':').map(Number)
        const startDateTime = createBerlinDate(icsBookingDate.getUTCFullYear(), icsBookingDate.getUTCMonth() + 1, icsBookingDate.getUTCDate(), icsHours, icsMinutes)
        const endDateTime = new Date(startDateTime.getTime() + booking.durationMinutes * 60000)

        const icsContent = createICSFile({
          start: startDateTime,
          end: endDateTime,
          summary: `Termin: ${serviceName} bei ${workshopName}`,
          description: `${serviceName} bei ${workshopName}\\n\\n📅 Termin: ${formattedDate} um ${booking.time} Uhr\\n🚗 Fahrzeug: ${vehicleMake} ${booking.vehicle.model}${booking.vehicle.licensePlate ? ` - ${booking.vehicle.licensePlate}` : ''}\\n💰 Gesamtpreis: ${Number(booking.totalPrice).toFixed(2)} €\\n\\n📍 Adresse:\\n${workshopName}\\n${workshopAddress}, ${workshopZip} ${workshopCity}`,
          location: `${workshopName}, ${workshopAddress}, ${workshopZip} ${workshopCity}`,
          organizerEmail: workshopEmail,
          organizerName: workshopName,
          attendeeEmail: customerEmail,
          attendeeName: customerName
        })

        const customerEmailData = directBookingConfirmationCustomerEmail({
          bookingId: booking.id,
          customerName,
          workshopName,
          workshopAddress: `${workshopAddress}, ${workshopZip} ${workshopCity}`,
          workshopPhone: workshopPhone || 'Nicht angegeben',
          workshopEmail,
          serviceType: booking.serviceType,
          serviceName,
          appointmentDate: formattedDate,
          appointmentTime: booking.time,
          durationMinutes: booking.durationMinutes,
          vehicleBrand: vehicleMake,
          vehicleModel: booking.vehicle.model,
          vehicleLicensePlate: booking.vehicle.licensePlate || undefined,
          basePrice: Number(booking.basePrice),
          balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : undefined,
          storagePrice: booking.storagePrice ? Number(booking.storagePrice) : undefined,
          washingPrice: booking.washingPrice ? Number(booking.washingPrice) : undefined,
          totalPrice: Number(booking.totalPrice),
          paymentMethod: booking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : booking.paymentMethod || 'Online',
          hasBalancing: booking.hasBalancing || undefined,
          hasStorage: booking.hasStorage || undefined,
          hasWashing: booking.hasWashing || undefined,
          tireBrand: tireBrand || undefined,
          tireModel: tireModel || undefined,
          tireSize: tireSize || undefined,
          tireQuantity: tireQuantity || undefined,
          tireData: tireData || undefined,
          totalTirePurchasePrice: tireTotalPrice ? Number(tireTotalPrice) : undefined,
        })
        
        await sendEmail({
          to: customerEmail,
          subject: customerEmailData.subject,
          html: customerEmailData.html,
          attachments: icsContent ? [{
            filename: 'termin.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }] : []
        })
        
        console.log(`[BOOK API] ✅ Confirmation email sent to ${customerEmail}`)
      } catch (emailError) {
        console.error('[BOOK API] Error sending confirmation email:', emailError)
      }

      // Send notification email to workshop (if enabled)
      if (booking.workshop.emailNotifyBookings) {
        try {
          const formattedDateWs = new Date(booking.date).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          const serviceLabelsWs: Record<string, string> = {
            'WHEEL_CHANGE': 'Räderwechsel',
            'TIRE_CHANGE': 'Reifenwechsel',
            'TIRE_REPAIR': 'Reifenreparatur',
            'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
            'ALIGNMENT_BOTH': 'Achsvermessung',
            'CLIMATE_SERVICE': 'Klimaservice'
          }
          const serviceNameWs = serviceDisplayName || serviceLabelsWs[booking.serviceType] || booking.serviceType

          const PLATFORM_COMMISSION_RATE = 0.069
          const platformCommission = Number(booking.totalPrice) * PLATFORM_COMMISSION_RATE
          const workshopPayout = Number(booking.totalPrice) - platformCommission

          const workshopEmailData = directBookingNotificationWorkshopEmail({
            bookingId: booking.id,
            workshopName,
            customerName,
            customerEmail,
            customerPhone: customerPhone || 'Nicht angegeben',
            serviceType: booking.serviceType,
            serviceName: serviceNameWs,
            appointmentDate: formattedDateWs,
            appointmentTime: booking.time,
            durationMinutes: booking.durationMinutes,
            vehicleBrand: vehicleMake,
            vehicleModel: booking.vehicle.model,
            vehicleLicensePlate: booking.vehicle.licensePlate || undefined,
            basePrice: Number(booking.basePrice),
            balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : undefined,
            storagePrice: booking.storagePrice ? Number(booking.storagePrice) : undefined,
            washingPrice: booking.washingPrice ? Number(booking.washingPrice) : undefined,
            totalPrice: Number(booking.totalPrice),
            platformCommission,
            workshopPayout,
            paymentMethod: booking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : booking.paymentMethod || 'Online',
            hasBalancing: booking.hasBalancing || undefined,
            hasStorage: booking.hasStorage || undefined,
            hasWashing: booking.hasWashing || undefined,
            tireBrand: tireBrand || undefined,
            tireModel: tireModel || undefined,
            tireSize: tireSize || undefined,
            tireArticleId: tireArticleNumber || undefined,
            tireQuantity: tireQuantity || undefined,
            tireData: tireData || undefined,
          })

          await sendEmail({
            to: workshopEmail,
            subject: workshopEmailData.subject,
            html: workshopEmailData.html
          })
          
          console.log(`[BOOK API] ✅ Workshop notification sent to ${workshopEmail}`)
        } catch (workshopEmailError) {
          console.error('[BOOK API] Error sending workshop notification:', workshopEmailError)
        }
      } else {
        console.log(`[BOOK API] ⏭️ Workshop ${booking.workshopId} has disabled booking notifications`)
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          workshopName: workshopName,
          date: booking.date,
          time: booking.time,
          vehicleBrand: vehicleMake,
          vehicleModel: booking.vehicle.model,
          totalPrice: booking.totalPrice,
          confirmationNumber: `DB-${booking.id.slice(-8).toUpperCase()}`
        }
      })
    }

    // RESERVATION FINALIZATION FLOW (with online payment)
    const { reservationId, paymentMethod, paymentId } = body
    
    console.log('[BOOK API] Reservation finalization flow:', { reservationId, paymentMethod, paymentId })

    if (!reservationId || !paymentMethod || !paymentId) {
      console.log('[BOOK API] ❌ Missing parameters')
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Get reservation
    const reservation = await prisma.directBooking.findUnique({
      where: { id: reservationId }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservierung nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if reservation is still valid
    if (reservation.status !== 'RESERVED') {
      return NextResponse.json(
        { error: 'Diese Reservierung ist nicht mehr gültig' },
        { status: 400 }
      )
    }

    if (new Date() > reservation.reservedUntil!) {
      // Reservation expired - delete it
      await prisma.directBooking.delete({
        where: { id: reservationId }
      })
      
      return NextResponse.json(
        { error: 'Reservierung ist abgelaufen. Bitte buchen Sie erneut.' },
        { status: 410 }
      )
    }

    // Update booking to confirmed
    const booking = await prisma.directBooking.update({
      where: { id: reservationId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod,
        paymentId,
        paidAt: new Date(),
        reservedUntil: null
      },
      include: {
        workshop: { include: { user: true } },
        vehicle: true,
        customer: { include: { user: true } }
      }
    })

    // Derived fields for reservation flow
    const rCustomerName = `${booking.customer.user.firstName || ''} ${booking.customer.user.lastName || ''}`.trim() || 'Kunde'
    const rCustomerEmail = booking.customer.user.email
    const rCustomerPhone = booking.customer.user.phone
    const rWorkshopName = booking.workshop.companyName
    const rWorkshopAddress = booking.workshop.user.street || ''
    const rWorkshopZip = booking.workshop.user.zipCode || ''
    const rWorkshopCity = booking.workshop.user.city || ''
    const rWorkshopPhone = booking.workshop.user.phone || ''
    const rWorkshopEmail = booking.workshop.user.email || ''
    const rVehicleMake = booking.vehicle.make

    // Create Google Calendar event for reservation
    try {
      if (booking.workshop.googleAccessToken && booking.workshop.googleRefreshToken && booking.workshop.googleCalendarId) {
        console.log('[BOOK API] Creating Google Calendar event for reservation via OAuth...')
        
        let accessToken = booking.workshop.googleAccessToken

        if (!accessToken || (booking.workshop.googleTokenExpiry && new Date() > booking.workshop.googleTokenExpiry)) {
          console.log('[BOOK API] Refreshing workshop Google token...')
          const newTokens = await refreshAccessToken(booking.workshop.googleRefreshToken)
          accessToken = newTokens.access_token || accessToken

          await prisma.workshop.update({
            where: { id: booking.workshopId },
            data: {
              googleAccessToken: accessToken,
              googleTokenExpiry: new Date(newTokens.expiry_date || Date.now() + 3600 * 1000)
            }
          })
        }
        
        const rServiceLabels: Record<string, string> = {
          'WHEEL_CHANGE': 'Räderwechsel',
          'TIRE_CHANGE': 'Reifenwechsel',
          'TIRE_REPAIR': 'Reifenreparatur',
          'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
          'ALIGNMENT_BOTH': 'Achsvermessung',
          'CLIMATE_SERVICE': 'Klimaservice'
        }

        const rBookingDate = new Date(booking.date)
        const [rCalHours, rCalMinutes] = booking.time.split(':').map(Number)
        const rStartDateTime = createBerlinDate(rBookingDate.getUTCFullYear(), rBookingDate.getUTCMonth() + 1, rBookingDate.getUTCDate(), rCalHours, rCalMinutes)
        const rEndDateTime = new Date(rStartDateTime.getTime() + booking.durationMinutes * 60000)
        
        const rCalDescription = [
          `${rCustomerName}`,
          `${rCustomerEmail}`,
          `Telefon: ${rCustomerPhone || 'Nicht angegeben'}`,
          '',
          `Fahrzeug: ${rVehicleMake} ${booking.vehicle.model}${booking.vehicle.licensePlate ? ` - ${booking.vehicle.licensePlate}` : ''}`,
          `Service: ${rServiceLabels[booking.serviceType] || booking.serviceType}`,
        ]
        if (booking.hasBalancing) rCalDescription.push('✅ Auswuchtung')
        if (booking.hasStorage) rCalDescription.push('✅ Einlagerung')
        if (booking.hasWashing) rCalDescription.push('✅ Räder waschen')
        rCalDescription.push('', `Gesamtpreis: ${Number(booking.totalPrice).toFixed(2)} €`)
        
        await createCalendarEvent(
          accessToken,
          booking.workshop.googleRefreshToken,
          booking.workshop.googleCalendarId,
          {
            summary: `${rServiceLabels[booking.serviceType] || booking.serviceType} - ${rVehicleMake} ${booking.vehicle.model}`,
            description: rCalDescription.join('\n'),
            start: rStartDateTime.toISOString(),
            end: rEndDateTime.toISOString(),
            attendees: [{ email: rCustomerEmail }]
          }
        )
        
        console.log('[BOOK API] ✅ Google Calendar event created for reservation')
      } else {
        console.log('[BOOK API] ⏭️ Workshop has no Google Calendar connected')
      }
    } catch (calendarError) {
      console.error('[BOOK API] Error creating calendar event for reservation:', calendarError)
    }

    // Send confirmation email
    try {
      const rFormattedDate = new Date(booking.date).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const rServiceLabelsEmail: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel',
        'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_REPAIR': 'Reifenreparatur',
        'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
        'ALIGNMENT_BOTH': 'Achsvermessung',
        'CLIMATE_SERVICE': 'Klimaservice'
      }
      const rServiceName = rServiceLabelsEmail[booking.serviceType] || booking.serviceType

      // Generate ICS calendar file
      const rIcsBookingDate = new Date(booking.date)
      const [rIcsHours, rIcsMinutes] = booking.time.split(':').map(Number)
      const rIcsStart = createBerlinDate(rIcsBookingDate.getUTCFullYear(), rIcsBookingDate.getUTCMonth() + 1, rIcsBookingDate.getUTCDate(), rIcsHours, rIcsMinutes)
      const rIcsEnd = new Date(rIcsStart.getTime() + booking.durationMinutes * 60000)

      const rIcsContent = createICSFile({
        start: rIcsStart,
        end: rIcsEnd,
        summary: `Termin: ${rServiceName} bei ${rWorkshopName}`,
        description: `${rServiceName} bei ${rWorkshopName}\\n\\n📅 Termin: ${rFormattedDate} um ${booking.time} Uhr\\n🚗 Fahrzeug: ${rVehicleMake} ${booking.vehicle.model}${booking.vehicle.licensePlate ? ` - ${booking.vehicle.licensePlate}` : ''}\\n💰 Gesamtpreis: ${Number(booking.totalPrice).toFixed(2)} €\\n\\n📍 Adresse:\\n${rWorkshopName}\\n${rWorkshopAddress}, ${rWorkshopZip} ${rWorkshopCity}`,
        location: `${rWorkshopName}, ${rWorkshopAddress}, ${rWorkshopZip} ${rWorkshopCity}`,
        organizerEmail: rWorkshopEmail,
        organizerName: rWorkshopName,
        attendeeEmail: rCustomerEmail,
        attendeeName: rCustomerName
      })

      const rCustomerEmailData = directBookingConfirmationCustomerEmail({
        bookingId: booking.id,
        customerName: rCustomerName,
        workshopName: rWorkshopName,
        workshopAddress: `${rWorkshopAddress}, ${rWorkshopZip} ${rWorkshopCity}`,
        workshopPhone: rWorkshopPhone || 'Nicht angegeben',
        workshopEmail: rWorkshopEmail,
        serviceType: booking.serviceType,
        serviceName: rServiceName,
        appointmentDate: rFormattedDate,
        appointmentTime: booking.time,
        durationMinutes: booking.durationMinutes,
        vehicleBrand: rVehicleMake,
        vehicleModel: booking.vehicle.model,
        vehicleLicensePlate: booking.vehicle.licensePlate || undefined,
        basePrice: Number(booking.basePrice),
        balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : undefined,
        storagePrice: booking.storagePrice ? Number(booking.storagePrice) : undefined,
        washingPrice: booking.washingPrice ? Number(booking.washingPrice) : undefined,
        totalPrice: Number(booking.totalPrice),
        paymentMethod: booking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : booking.paymentMethod || 'Online',
        hasBalancing: booking.hasBalancing || undefined,
        hasStorage: booking.hasStorage || undefined,
        hasWashing: booking.hasWashing || undefined,
      })
      
      await sendEmail({
        to: rCustomerEmail,
        subject: rCustomerEmailData.subject,
        html: rCustomerEmailData.html,
        attachments: rIcsContent ? [{
          filename: 'termin.ics',
          content: rIcsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }] : []
      })
      
      console.log(`[BOOK API] ✅ Confirmation email sent to ${rCustomerEmail}`)
    } catch (emailError) {
      console.error('[BOOK API] Error sending confirmation email:', emailError)
    }

    // Send workshop notification for reservation
    if (booking.workshop.emailNotifyBookings) {
      try {
        const rFormattedDateWs = new Date(booking.date).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        const rServiceLabelsWs: Record<string, string> = {
          'WHEEL_CHANGE': 'Räderwechsel',
          'TIRE_CHANGE': 'Reifenwechsel',
          'TIRE_REPAIR': 'Reifenreparatur',
          'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
          'ALIGNMENT_BOTH': 'Achsvermessung',
          'CLIMATE_SERVICE': 'Klimaservice'
        }
        const rServiceNameWs = rServiceLabelsWs[booking.serviceType] || booking.serviceType

        const PLATFORM_COMMISSION_RATE = 0.069
        const rPlatformCommission = Number(booking.totalPrice) * PLATFORM_COMMISSION_RATE
        const rWorkshopPayout = Number(booking.totalPrice) - rPlatformCommission

        const rWorkshopEmailData = directBookingNotificationWorkshopEmail({
          bookingId: booking.id,
          workshopName: rWorkshopName,
          customerName: rCustomerName,
          customerEmail: rCustomerEmail,
          customerPhone: rCustomerPhone || 'Nicht angegeben',
          serviceType: booking.serviceType,
          serviceName: rServiceNameWs,
          appointmentDate: rFormattedDateWs,
          appointmentTime: booking.time,
          durationMinutes: booking.durationMinutes,
          vehicleBrand: rVehicleMake,
          vehicleModel: booking.vehicle.model,
          vehicleLicensePlate: booking.vehicle.licensePlate || undefined,
          basePrice: Number(booking.basePrice),
          balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : undefined,
          storagePrice: booking.storagePrice ? Number(booking.storagePrice) : undefined,
          washingPrice: booking.washingPrice ? Number(booking.washingPrice) : undefined,
          totalPrice: Number(booking.totalPrice),
          platformCommission: rPlatformCommission,
          workshopPayout: rWorkshopPayout,
          paymentMethod: booking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : booking.paymentMethod || 'Online',
          hasBalancing: booking.hasBalancing || undefined,
          hasStorage: booking.hasStorage || undefined,
          hasWashing: booking.hasWashing || undefined,
        })

        await sendEmail({
          to: rWorkshopEmail,
          subject: rWorkshopEmailData.subject,
          html: rWorkshopEmailData.html
        })
        
        console.log(`[BOOK API] ✅ Workshop notification sent to ${rWorkshopEmail}`)
      } catch (workshopEmailError) {
        console.error('[BOOK API] Error sending workshop notification:', workshopEmailError)
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        workshopName: rWorkshopName,
        date: booking.date,
        time: booking.time,
        vehicleBrand: rVehicleMake,
        vehicleModel: booking.vehicle.model,
        totalPrice: booking.totalPrice,
        confirmationNumber: `DB-${booking.id.slice(-8).toUpperCase()}`
      }
    })

  } catch (error) {
    console.error('Error finalizing booking:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Buchungsbestätigung' },
      { status: 500 }
    )
  }
}
