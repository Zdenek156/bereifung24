import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reservationId, paymentMethod, paymentId } = body

    if (!reservationId || !paymentMethod || !paymentId) {
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
