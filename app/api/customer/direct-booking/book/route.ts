import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { Decimal } from '@prisma/client/runtime/library'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[BOOK API] ❌ Not authenticated')
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    console.log('[BOOK API] ✅ User authenticated:', session.user.id)
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
        basePrice,
        balancingPrice,
        storagePrice,
        totalPrice, 
        durationMinutes,
        paymentMethod, 
        paymentId 
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
      let customer = await prisma.customer.findUnique({
        where: { userId: session.user.id }
      })

      if (!customer) {
        console.log('[BOOK API] Creating new Customer record for user:', session.user.id)
        customer = await prisma.customer.create({
          data: {
            userId: session.user.id
          }
        })
      }

      // Create booking after successful payment
      const booking = await prisma.directBooking.create({
        data: {
          workshopId,
          serviceType,
          vehicleId,
          customerId: customer.id,
          date: new Date(date + 'T00:00:00'), // Convert YYYY-MM-DD to Date at midnight
          time,
          hasBalancing: hasBalancing || false,
          hasStorage: hasStorage || false,
          basePrice: new Decimal(basePrice),
          balancingPrice: balancingPrice ? new Decimal(balancingPrice) : null,
          storagePrice: storagePrice ? new Decimal(storagePrice) : null,
          totalPrice: new Decimal(totalPrice),
          durationMinutes: durationMinutes || 60,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod,
          paymentId: paymentId,
          paidAt: new Date()
        },
        include: {
          workshop: true,
          vehicle: true,
          customer: true
        }
      })

      console.log('[BOOK API] ✅ Booking created:', booking.id)

      // Create Google Calendar event
      try {
        const calendarUrl = booking.workshop.googleCalendarUrl
        const calendarId = calendarUrl?.match(/calendar\/embed\?src=([^&]+)/)?.[1]
        
        if (calendarId) {
          const { google } = require('googleapis')
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
              private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/calendar']
          })
          
          const calendar = google.calendar({ version: 'v3', auth })
          
          const startDateTime = new Date(booking.date)
          startDateTime.setHours(parseInt(booking.time.split(':')[0]), parseInt(booking.time.split(':')[1]))
          
          const endDateTime = new Date(startDateTime)
          endDateTime.setMinutes(endDateTime.getMinutes() + booking.durationMinutes)
          
          const serviceTypes: any = {
            WHEEL_CHANGE: 'Räderwechsel',
            TIRE_REPAIR: 'Reifenreparatur',
            WHEEL_ALIGNMENT: 'Achsvermessung',
            AC_SERVICE: 'Klimaanlagen-Service',
            OTHER: 'Sonstige Reifendienste'
          }
          
          await calendar.events.insert({
            calendarId: decodeURIComponent(calendarId),
            requestBody: {
              summary: `${serviceTypes[booking.serviceType] || booking.serviceType} - ${booking.vehicle.brand} ${booking.vehicle.model}`,
              description: `Kunde: ${booking.customer.name}\nKennzeichen: ${booking.vehicle.licensePlate}\nTelefon: ${booking.customer.phone || 'Nicht angegeben'}\nEmail: ${booking.customer.email}\n\nBuchungsnummer: DB-${booking.id.slice(-8).toUpperCase()}`,
              start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Berlin' },
              end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Berlin' },
              attendees: [{ email: booking.customer.email }],
              reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 24 * 60 }] }
            }
          })
          
          console.log('[BOOK API] ✅ Google Calendar event created')
        }
      } catch (calendarError) {
        console.error('[BOOK API] Error creating calendar event:', calendarError)
      }

      // Send confirmation email to customer
      try {
        const templatePath = path.join(process.cwd(), 'email-templates', 'direct-booking-confirmation.js')
        const template = require(templatePath)
        
        const compiledTemplate = Handlebars.compile(template.html)
        
        const serviceTypes: any = {
          WHEEL_CHANGE: '🔄 Räderwechsel',
          TIRE_REPAIR: '🔧 Reifenreparatur',
          WHEEL_ALIGNMENT: '📐 Achsvermessung',
          AC_SERVICE: '❄️ Klimaanlagen-Service',
          OTHER: '🛠️ Sonstige Reifendienste'
        }
        
        const emailHtml = compiledTemplate({
          customerName: booking.customer.name || 'Kunde',
          workshopName: booking.workshop.name,
          workshopAddress: `${booking.workshop.address}, ${booking.workshop.postalCode} ${booking.workshop.city}`,
          workshopPhone: booking.workshop.phone || 'Nicht angegeben',
          workshopEmail: booking.workshop.email || 'Nicht angegeben',
          bookingNumber: `DB-${booking.id.slice(-8).toUpperCase()}`,
          serviceType: serviceTypes[booking.serviceType] || booking.serviceType,
          appointmentDate: new Date(booking.date).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          appointmentTime: booking.time,
          vehicleBrand: booking.vehicle.brand,
          vehicleModel: booking.vehicle.model,
          licensePlate: booking.vehicle.licensePlate,
          totalPrice: booking.totalPrice.toString(),
          hasBalancing: booking.hasBalancing,
          hasStorage: booking.hasStorage,
          dashboardLink: `${process.env.NEXTAUTH_URL}/dashboard/customer/bookings`,
          platformUrl: process.env.NEXTAUTH_URL,
          supportUrl: `${process.env.NEXTAUTH_URL}/support`
        })
        
        await sendEmail({
          to: booking.customer.email,
          subject: `Buchungsbestätigung - ${booking.workshop.name}`,
          html: emailHtml
        })
        
        console.log(`✅ Confirmation email sent to ${booking.customer.email}`)
      } catch (emailError) {
        console.error('[BOOK API] Error sending confirmation email:', emailError)
      }

      // Send notification email to workshop
      try {
        const workshopTemplateContent = await prisma.emailTemplate.findFirst({
          where: { key: 'direct_booking_workshop_notification' }
        })
        
        if (workshopTemplateContent) {
          const compiledWorkshopTemplate = Handlebars.compile(workshopTemplateContent.htmlContent)
          
          const serviceTypes: any = {
            WHEEL_CHANGE: 'Räderwechsel',
            TIRE_REPAIR: 'Reifenreparatur',
            WHEEL_ALIGNMENT: 'Achsvermessung',
            AC_SERVICE: 'Klimaanlagen-Service',
            OTHER: 'Sonstige Reifendienste'
          }
          
          const workshopEmailHtml = compiledWorkshopTemplate({
            workshopName: booking.workshop.name,
            customerName: booking.customer.name || 'Kunde',
            customerEmail: booking.customer.email,
            customerPhone: booking.customer.phone || 'Nicht angegeben',
            bookingNumber: `DB-${booking.id.slice(-8).toUpperCase()}`,
            serviceType: serviceTypes[booking.serviceType] || booking.serviceType,
            appointmentDate: new Date(booking.date).toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            appointmentTime: booking.time,
            vehicleBrand: booking.vehicle.brand,
            vehicleModel: booking.vehicle.model,
            licensePlate: booking.vehicle.licensePlate,
            totalPrice: booking.totalPrice.toString(),
            hasBalancing: booking.hasBalancing,
            hasStorage: booking.hasStorage,
            dashboardLink: `${process.env.NEXTAUTH_URL}/dashboard/workshop/bookings`
          })
          
          await sendEmail({
            to: booking.workshop.email,
            subject: `Neue Direktbuchung - ${serviceTypes[booking.serviceType] || booking.serviceType}`,
            html: workshopEmailHtml
          })
          
          console.log(`✅ Workshop notification sent to ${booking.workshop.email}`)
        }
      } catch (workshopEmailError) {
        console.error('[BOOK API] Error sending workshop notification:', workshopEmailError)
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          workshopName: booking.workshop.name,
          date: booking.date,
          time: booking.time,
          vehicleBrand: booking.vehicle.brand,
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
        workshop: true,
        vehicle: true,
        customer: true
      }
    })

    // Send confirmation email
    try {
      const templatePath = path.join(process.cwd(), 'email-templates', 'direct-booking-confirmation.js')
      const template = require(templatePath)
      
      const compiledTemplate = Handlebars.compile(template.html)
      
      const serviceTypes: any = {
        WHEEL_CHANGE: '🔄 Räderwechsel',
        TIRE_REPAIR: '🔧 Reifenreparatur',
        WHEEL_ALIGNMENT: '📐 Achsvermessung',
        AC_SERVICE: '❄️ Klimaanlagen-Service',
        OTHER: '🛠️ Sonstige Reifendienste'
      }
      
      const emailHtml = compiledTemplate({
        customerName: booking.customer.name || 'Kunde',
        workshopName: booking.workshop.name,
        workshopAddress: `${booking.workshop.address}, ${booking.workshop.postalCode} ${booking.workshop.city}`,
        workshopPhone: booking.workshop.phone || 'Nicht angegeben',
        workshopEmail: booking.workshop.email || 'Nicht angegeben',
        bookingNumber: `DB-${booking.id.slice(-8).toUpperCase()}`,
        serviceType: serviceTypes[booking.serviceType] || booking.serviceType,
        appointmentDate: new Date(booking.date).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: booking.time,
        vehicleBrand: booking.vehicle.brand,
        vehicleModel: booking.vehicle.model,
        licensePlate: booking.vehicle.licensePlate,
        totalPrice: booking.totalPrice.toString(),
        hasBalancing: booking.hasBalancing,
        hasStorage: booking.hasStorage,
        dashboardLink: `${process.env.NEXTAUTH_URL}/dashboard/customer/bookings`,
        platformUrl: process.env.NEXTAUTH_URL,
        supportUrl: `${process.env.NEXTAUTH_URL}/support`
      })
      
      await sendEmail({
        to: booking.customer.email,
        subject: `Buchungsbestätigung - ${booking.workshop.name}`,
        html: emailHtml
      })
      
      console.log(`✅ Confirmation email sent to ${booking.customer.email}`)
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        workshopName: booking.workshop.name,
        date: booking.date,
        time: booking.time,
        vehicleBrand: booking.vehicle.brand,
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
