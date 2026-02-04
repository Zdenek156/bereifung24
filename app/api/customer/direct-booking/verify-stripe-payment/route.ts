import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { google } from 'googleapis'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Extract metadata
    const metadata = checkoutSession.metadata!
    const {
      workshopId,
      serviceType,
      vehicleId,
      date,
      time,
      hasBalancing,
      hasStorage,
      totalPrice
    } = metadata

    // Check if booking already exists (prevent duplicates)
    const existingBooking = await prisma.directBooking.findFirst({
      where: {
        customerId: session.user.id,
        workshopId,
        date: new Date(date),
        time,
        paymentId: checkoutSession.payment_intent as string
      }
    })

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        bookingId: existingBooking.id,
        message: 'Booking already exists'
      })
    }

    // Get workshop details for email and calendar
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            street: true,
            city: true,
            zipCode: true,
            phone: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Get customer details
    const customer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        street: true,
        city: true,
        zipCode: true
      }
    })

    // Get vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!customer || !vehicle) {
      return NextResponse.json({ error: 'Customer or vehicle not found' }, { status: 404 })
    }

    // Create DirectBooking
    const directBooking = await prisma.directBooking.create({
      data: {
        customerId: session.user.id,
        workshopId,
        vehicleId,
        serviceType,
        date: new Date(date),
        time,
        basePrice: Number(totalPrice),
        balancingPrice: hasBalancing === 'true' ? 10 : null,
        storagePrice: hasStorage === 'true' ? 20 : null,
        totalPrice: Number(totalPrice),
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE',
        paymentId: checkoutSession.payment_intent as string,
        status: 'CONFIRMED'
      }
    })

    // **1. Google Calendar Integration**
    try {
      if (workshop.googleCalendarId && workshop.googleAccessToken && workshop.googleRefreshToken) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + '/api/gcal/callback'
        )

        oauth2Client.setCredentials({
          access_token: workshop.googleAccessToken,
          refresh_token: workshop.googleRefreshToken
        })

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        // Parse date and time
        const [hours, minutes] = time.split(':')
        const startDate = new Date(date)
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        
        const endDate = new Date(startDate)
        endDate.setHours(startDate.getHours() + 1) // Default 1 hour duration

        const serviceLabels: Record<string, string> = {
          WHEEL_CHANGE: 'Räderwechsel',
          TIRE_REPAIR: 'Reifenreparatur',
          WHEEL_ALIGNMENT: 'Achsvermessung',
          AC_SERVICE: 'Klimaanlagen-Service'
        }

        await calendar.events.insert({
          calendarId: workshop.googleCalendarId,
          requestBody: {
            summary: `${serviceLabels[serviceType] || serviceType} - ${customer.firstName} ${customer.lastName}`,
            description: `
Kunde: ${customer.firstName} ${customer.lastName}
Tel: ${customer.phone || 'Nicht angegeben'}
Email: ${customer.email}
Fahrzeug: ${vehicle.make} ${vehicle.model} (${vehicle.year})
Kennzeichen: ${vehicle.licensePlate}
Service: ${serviceLabels[serviceType] || serviceType}
Preis: ${totalPrice} €
Bezahlt: Ja (Stripe)
Buchungs-ID: ${directBooking.id}
            `.trim(),
            start: {
              dateTime: startDate.toISOString(),
              timeZone: 'Europe/Berlin'
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'Europe/Berlin'
            },
            attendees: [
              { email: customer.email }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 }       // 1 hour before
              ]
            }
          }
        })

        console.log('✅ Google Calendar event created for Stripe booking:', directBooking.id)
      }
    } catch (calendarError) {
      console.error('❌ Failed to create Google Calendar event:', calendarError)
      // Don't fail the booking if calendar creation fails
    }

    // **2. Send Email to Workshop**
    try {
      const serviceLabels: Record<string, string> = {
        WHEEL_CHANGE: 'Räderwechsel',
        TIRE_REPAIR: 'Reifenreparatur',
        WHEEL_ALIGNMENT: 'Achsvermessung',
        AC_SERVICE: 'Klimaanlagen-Service'
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Neue Direktbuchung!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Hallo ${workshop.user.firstName},</p>
            <p style="font-size: 16px; color: #374151;">Sie haben eine neue Direktbuchung über Stripe erhalten:</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h2 style="margin-top: 0; color: #1f2937;">📅 Termindetails</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Datum:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${new Date(date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Uhrzeit:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${time} Uhr</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Service:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${serviceLabels[serviceType] || serviceType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Preis:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #10b981;">${totalPrice} € (Bereits bezahlt via Stripe)</td>
                </tr>
              </table>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">👤 Kundendaten</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${customer.firstName} ${customer.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">E-Mail:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${customer.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Telefon:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${customer.phone || 'Nicht angegeben'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Adresse:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${customer.street}, ${customer.zipCode} ${customer.city}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">🚗 Fahrzeugdaten</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Fahrzeug:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${vehicle.make} ${vehicle.model} (${vehicle.year})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Kennzeichen:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${vehicle.licensePlate}</td>
                </tr>
              </table>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>✓ Zahlung erfolgreich:</strong> Der Kunde hat bereits ${totalPrice} € via Stripe bezahlt.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop/appointments" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Termin anzeigen
              </a>
            </div>
          </div>

          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
            <p>© ${new Date().getFullYear()} Bereifung24 - Ihr Partner für Reifenservice</p>
          </div>
        </div>
      `

      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: workshop.user.email,
          subject: `🎉 Neue Direktbuchung von ${customer.firstName} ${customer.lastName} - ${new Date(date).toLocaleDateString('de-DE')} um ${time} Uhr`,
          html: emailHtml
        })
      })

      if (!emailResponse.ok) {
        console.error('Failed to send workshop email')
      } else {
        console.log('✅ Workshop notification email sent')
      }
    } catch (emailError) {
      console.error('❌ Failed to send workshop email:', emailError)
    }

    // **3. Send Confirmation Email to Customer**
    try {
      const serviceLabels: Record<string, string> = {
        WHEEL_CHANGE: 'Räderwechsel',
        TIRE_REPAIR: 'Reifenreparatur',
        WHEEL_ALIGNMENT: 'Achsvermessung',
        AC_SERVICE: 'Klimaanlagen-Service'
      }

      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Buchung bestätigt!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Hallo ${customer.firstName},</p>
            <p style="font-size: 16px; color: #374151;">Ihre Buchung wurde erfolgreich bestätigt. Die Zahlung über Stripe war erfolgreich.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h2 style="margin-top: 0; color: #1f2937;">📅 Ihr Termin</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Werkstatt:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${workshop.companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Datum:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${new Date(date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Uhrzeit:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${time} Uhr</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Service:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${serviceLabels[serviceType] || serviceType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Fahrzeug:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})</td>
                </tr>
              </table>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>✓ Bezahlt:</strong> ${totalPrice} € via Stripe
              </p>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">📍 Werkstatt-Adresse</h2>
              <p style="margin: 5px 0; color: #1f2937;">${workshop.companyName}</p>
              <p style="margin: 5px 0; color: #6b7280;">${workshop.user.street}</p>
              <p style="margin: 5px 0; color: #6b7280;">${workshop.user.zipCode} ${workshop.user.city}</p>
              <p style="margin: 5px 0; color: #6b7280;">Tel: ${workshop.user.phone}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/customer/bookings" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Meine Buchungen anzeigen
              </a>
            </div>
          </div>

          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Wir freuen uns auf Ihren Besuch!</p>
            <p>© ${new Date().getFullYear()} Bereifung24 - Ihr Partner für Reifenservice</p>
          </div>
        </div>
      `

      const customerEmailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.email,
          subject: `✅ Buchung bestätigt - ${workshop.companyName} - ${new Date(date).toLocaleDateString('de-DE')} um ${time} Uhr`,
          html: customerEmailHtml
        })
      })

      if (!customerEmailResponse.ok) {
        console.error('Failed to send customer confirmation email')
      } else {
        console.log('✅ Customer confirmation email sent')
      }
    } catch (emailError) {
      console.error('❌ Failed to send customer email:', emailError)
    }

    return NextResponse.json({
      success: true,
      bookingId: directBooking.id
    })

  } catch (error) {
    console.error('Error verifying Stripe payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
