import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { sendEmail, createICSFile, directBookingConfirmationCustomerEmail, directBookingNotificationWorkshopEmail } from '@/lib/email'
import { createCalendarEvent, refreshAccessToken } from '@/lib/google-calendar'
import { createBerlinDate } from '@/lib/timezone-utils'
import { Decimal } from '@prisma/client/runtime/library'
import Stripe from 'stripe'
import { getApiSetting } from '@/lib/api-settings'
import { buildVehicleSnapshot } from '@/lib/vehicle-snapshot'

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

    // Validate user has complete profile (address required for booking)
    const bookingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { street: true, zipCode: true, city: true, firstName: true, lastName: true }
    })
    if (!bookingUser || !bookingUser.street?.trim() || !bookingUser.zipCode?.trim() || !bookingUser.city?.trim()) {
      console.log('[BOOK API] ❌ Incomplete profile - missing address')
      return NextResponse.json(
        { error: 'Bitte vervollständigen Sie Ihr Profil (Adresse) bevor Sie buchen können.' },
        { status: 400 }
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
        disposalFee,
        runFlatSurcharge,
        hasDisposal,
        customerNotes,
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

      // Check for slot conflicts (prevent double booking)
      const existingBookings = await prisma.directBooking.findMany({
        where: {
          workshopId,
          date: new Date(date + 'T00:00:00'),
          time,
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        select: { id: true }
      })
      // Also check active reservations (not expired)
      const activeReservations = await prisma.directBooking.findMany({
        where: {
          workshopId,
          date: new Date(date + 'T00:00:00'),
          time,
          status: 'RESERVED',
          reservedUntil: { gt: new Date() },
          customerId: { not: customer.id } // allow own reservation
        },
        select: { id: true }
      })
      if (existingBookings.length > 0 || activeReservations.length > 0) {
        console.log('[BOOK API] ❌ Slot conflict:', { date, time, existingBookings: existingBookings.length, activeReservations: activeReservations.length })
        return NextResponse.json(
          { error: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle einen anderen Zeitslot.' },
          { status: 409 }
        )
      }

      // Create booking after successful payment
      console.log('💰 [BOOK] Creating CONFIRMED booking:', { workshop: workshopId, date, totalPrice })
      
      // Calculate commission breakdown (6.9% platform commission)
      const PLATFORM_COMMISSION_RATE = 0.069
      const totalPriceNum = parseFloat(totalPrice)
      const platformCommission = totalPriceNum * PLATFORM_COMMISSION_RATE
      const workshopPayout = totalPriceNum - platformCommission
      const platformCommissionCents = Math.round(platformCommission * 100)
      const stripeFeesEstimate = (totalPriceNum * 0.015) + 0.25
      const platformNetCommission = platformCommission - stripeFeesEstimate
      const vehicleSnapshot = await buildVehicleSnapshot(vehicleId)

      const booking = await prisma.directBooking.create({
        data: {
          workshopId,
          serviceType,
          ...(serviceSubtype ? { serviceSubtype } : {}),
          vehicleId,
          ...(vehicleSnapshot ? { vehicleSnapshot } : {}),
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
          stripePaymentId: paymentMethod === 'STRIPE' ? paymentId : null,
          paidAt: new Date(),
          // Commission fields
          platformCommission,
          platformCommissionCents,
          workshopPayout,
          stripeFeesEstimate,
          platformNetCommission,
          // Tire data
          ...(tireBrand ? { tireBrand } : {}),
          ...(tireModel ? { tireModel } : {}),
          ...(tireArticleNumber ? { tireArticleId: tireArticleNumber } : {}),
          ...(tireQuantity ? { tireQuantity: Number(tireQuantity) } : {}),
          ...(tirePricePerUnit ? { tirePurchasePrice: new Decimal(tirePricePerUnit) } : {}),
          ...(tireTotalPrice ? { totalTirePurchasePrice: new Decimal(tireTotalPrice) } : {}),
          ...(tireSize ? { tireSize } : {}),
          ...(tireData ? { tireData } : {}),
          hasDisposal: hasDisposal || false,
          disposalFee: disposalFee ? new Decimal(disposalFee) : null,
          runFlatSurcharge: runFlatSurcharge ? new Decimal(runFlatSurcharge) : null,
          ...(customerNotes ? { customerNotes: String(customerNotes).slice(0, 500) } : {}),
        },
        include: {
          workshop: { include: { user: true } },
          vehicle: true,
          customer: { include: { user: true } }
        }
      })

      console.log('[BOOK API] ✅ Booking created:', booking.id)

      // Fetch actual Stripe fee and payment method detail (async, non-blocking)
      if (paymentMethod === 'STRIPE' && paymentId) {
        try {
          const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')
          if (stripeSecretKey) {
            const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion })
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentId, {
              expand: ['latest_charge']
            })
            
            const charge = paymentIntent.latest_charge as Stripe.Charge | null
            if (charge) {
              const pmDetail = charge.payment_method_details?.type || null
              let actualStripeFee: number | null = null
              
              if (charge.balance_transaction) {
                const btId = typeof charge.balance_transaction === 'string'
                  ? charge.balance_transaction
                  : charge.balance_transaction.id
                const bt = await stripe.balanceTransactions.retrieve(btId)
                actualStripeFee = bt.fee / 100
              }
              
              await prisma.directBooking.update({
                where: { id: booking.id },
                data: {
                  paymentMethodDetail: pmDetail,
                  ...(actualStripeFee !== null && { stripeFee: actualStripeFee }),
                  ...(actualStripeFee !== null && { platformNetCommission: platformCommission - actualStripeFee }),
                }
              })
              console.log('[BOOK API] 💰 Stripe fee updated:', { stripeFee: actualStripeFee, paymentMethodDetail: pmDetail })
            }
          }
        } catch (feeError) {
          console.error('[BOOK API] ⚠️ Error retrieving Stripe fee (non-critical):', feeError instanceof Error ? feeError.message : feeError)
        }
      }

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
        // Determine calendar credentials: workshop first, then fallback to employee
        let calAccessToken: string | null = null
        let calRefreshToken: string | null = null
        let calCalendarId: string | null = null
        let calSource = ''

        if (booking.workshop.googleAccessToken && booking.workshop.googleRefreshToken && booking.workshop.googleCalendarId) {
          calAccessToken = booking.workshop.googleAccessToken
          calRefreshToken = booking.workshop.googleRefreshToken
          calCalendarId = booking.workshop.googleCalendarId
          calSource = 'workshop'
          console.log('[BOOK API] Using WORKSHOP Google Calendar')
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
            console.log(`[BOOK API] Using EMPLOYEE Google Calendar: ${empWithCal.name}`)
          }
        }

        if (calAccessToken && calRefreshToken && calCalendarId) {
          console.log(`[BOOK API] Creating Google Calendar event via OAuth (${calSource})...`)
          
          let accessToken = calAccessToken

          // Refresh token if expired
          try {
            console.log('[BOOK API] Refreshing Google token...')
            const newTokens = await refreshAccessToken(calRefreshToken)
            if (newTokens.access_token) {
              accessToken = newTokens.access_token
            }
          } catch (refreshErr) {
            console.warn('[BOOK API] Token refresh failed, trying with existing token:', refreshErr instanceof Error ? refreshErr.message : refreshErr)
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
            // Workshop calendar always in German (workshop's language), ignore client locale
            `Service: ${serviceLabels[booking.serviceType] || booking.serviceType}`,
          ]
          if (booking.hasBalancing) calDescription.push(`✅ Auswuchtung${booking.balancingPrice ? `: ${Number(booking.balancingPrice).toFixed(2)} €` : ''}`)
          if (booking.hasStorage) calDescription.push(`✅ Einlagerung${booking.storagePrice ? `: ${Number(booking.storagePrice).toFixed(2)} €` : ''}`)
          if (booking.hasWashing) calDescription.push(`✅ Räder waschen${booking.washingPrice ? `: ${Number(booking.washingPrice).toFixed(2)} €` : ''}`)
          if (booking.hasDisposal) calDescription.push('✅ Entsorgung')
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
          } else if (tireData?.axleContext === 'front' || tireData?.axleContext === 'rear') {
            // Single-axle Mischbereifung selection: explicit axle label so the
            // workshop knows whether the customer booked Vorder- oder Hinterachse.
            const isMoto = booking.serviceType === 'MOTORCYCLE_TIRE'
            const block = tireData.axleContext === 'front' ? tireData.front : tireData.rear
            const axleLabel = tireData.axleContext === 'front'
              ? (isMoto ? 'Vorderrad' : 'Vorderachse (VA)')
              : (isMoto ? 'Hinterrad' : 'Hinterachse (HA)')
            const qty = block?.quantity || tireQuantity || 2
            const brand = block?.brand || tireBrand || ''
            const model = block?.model || tireModel || ''
            const size = block?.size || tireSize
            calDescription.push('', `🛞 Reifen — ${axleLabel}:`)
            calDescription.push(`${qty}× ${brand} ${model}`.trim())
            if (size) calDescription.push(`   Größe: ${size}`)
          } else if (tireBrand) {
            calDescription.push('', `🛞 Reifen: ${tireQuantity || 4}× ${tireBrand} ${tireModel || ''}`)
            if (tireSize) calDescription.push(`   Größe: ${tireSize}`)
          }
          calDescription.push('')
          // Price breakdown in calendar
          if (booking.basePrice && Number(booking.basePrice) > 0) {
            // Workshop calendar always in German
            const basePriceLabel = (booking.serviceType === 'TIRE_CHANGE' && !tireTotalPrice) ? 'Montage' : (serviceLabels[booking.serviceType] || 'Service')
            calDescription.push(`${basePriceLabel}: ${Number(booking.basePrice).toFixed(2)} €`)
          }
          if (booking.balancingPrice && Number(booking.balancingPrice) > 0) {
            calDescription.push(`Auswuchtung: ${Number(booking.balancingPrice).toFixed(2)} €`)
          }
          if (booking.storagePrice && Number(booking.storagePrice) > 0) {
            calDescription.push(`Einlagerung: ${Number(booking.storagePrice).toFixed(2)} €`)
          }
          if (booking.washingPrice && Number(booking.washingPrice) > 0) {
            calDescription.push(`Räder waschen: ${Number(booking.washingPrice).toFixed(2)} €`)
          }
          if (booking.disposalFee && Number(booking.disposalFee) > 0) {
            calDescription.push(`Entsorgung: ${Number(booking.disposalFee).toFixed(2)} €`)
          }
          if (booking.runFlatSurcharge && Number(booking.runFlatSurcharge) > 0) {
            calDescription.push(`RunFlat-Zuschlag: ${Number(booking.runFlatSurcharge).toFixed(2)} €`)
          }
          calDescription.push(`Gesamtpreis: ${Number(booking.totalPrice).toFixed(2)} €`)
          if (customerNotes) {
            calDescription.push('', `📝 Kundennachricht: ${customerNotes}`)
          }
          
          const calSummaryTire = tireData?.isMixedTires
            ? ` - ${tireData.front?.brand || ''} / ${tireData.rear?.brand || ''}`
            : (tireData?.axleContext === 'front' || tireData?.axleContext === 'rear')
              ? ` - ${(tireData.axleContext === 'front' ? tireData.front?.brand : tireData.rear?.brand) || tireBrand || ''}`
              : tireBrand ? ` - ${tireBrand}` : ''
          
          await createCalendarEvent(
            accessToken,
            calRefreshToken,
            calCalendarId,
            {
              // Workshop calendar always in German
              summary: `${serviceLabels[booking.serviceType] || booking.serviceType} - ${vehicleMake} ${booking.vehicle.model}${calSummaryTire}`,
              description: calDescription.join('\n'),
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              attendees: [{ email: customerEmail }]
            }
          )
          
          console.log(`[BOOK API] ✅ Google Calendar event created (${calSource})`)
        } else {
          console.log('[BOOK API] ⏭️ No Google Calendar connected (workshop or employee)')
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
          hasDisposal: booking.hasDisposal || undefined,
          disposalFee: booking.disposalFee ? Number(booking.disposalFee) : undefined,
          runFlatSurcharge: booking.runFlatSurcharge ? Number(booking.runFlatSurcharge) : undefined,
          tireBrand: tireBrand || undefined,
          tireModel: tireModel || undefined,
          tireSize: tireSize || undefined,
          tireQuantity: tireQuantity || undefined,
          tireData: tireData || undefined,
          totalTirePurchasePrice: tireTotalPrice ? Number(tireTotalPrice) : undefined,
          customerNotes: customerNotes || undefined,
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
          // Workshop notification always in German (workshop's language), ignore client locale
          const serviceNameWs = serviceLabelsWs[booking.serviceType] || booking.serviceType

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
            hasDisposal: booking.hasDisposal || undefined,
            disposalFee: booking.disposalFee ? Number(booking.disposalFee) : undefined,
            runFlatSurcharge: booking.runFlatSurcharge ? Number(booking.runFlatSurcharge) : undefined,
            tireBrand: tireBrand || undefined,
            tireModel: tireModel || undefined,
            tireSize: tireSize || undefined,
            tireArticleId: tireArticleNumber || undefined,
            tireQuantity: tireQuantity || undefined,
            tireData: tireData || undefined,
            customerNotes: customerNotes || undefined,
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
