import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, bookingConfirmationCustomerEmailTemplate, bookingConfirmationWorkshopEmailTemplate } from '@/lib/email'

// GET /api/bookings - Get all bookings for current customer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Get all bookings with related data
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        workshop: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true,
              }
            }
          }
        },
        tireRequest: {
          select: {
            season: true,
            width: true,
            aspectRatio: true,
            diameter: true,
            quantity: true,
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    })

    // Format response
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      appointmentDate: booking.appointmentDate.toISOString(),
      appointmentTime: booking.appointmentTime,
      estimatedDuration: booking.estimatedDuration,
      status: booking.status,
      workshop: {
        companyName: booking.workshop.companyName,
        street: booking.workshop.user.street || '',
        zipCode: booking.workshop.user.zipCode || '',
        city: booking.workshop.user.city || '',
        phone: booking.workshop.user.phone || '',
      },
      tireRequest: {
        season: booking.tireRequest.season,
        width: booking.tireRequest.width,
        aspectRatio: booking.tireRequest.aspectRatio,
        diameter: booking.tireRequest.diameter,
        quantity: booking.tireRequest.quantity,
      },
      review: booking.review ? {
        id: booking.review.id,
        rating: booking.review.rating,
        comment: booking.review.comment,
      } : null
    }))

    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error('Bookings GET error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Termine' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create a new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      offerId,
      workshopId,
      appointmentDate,
      appointmentEndTime,
      paymentMethod,
      customerMessage,
      selectedTireOptionId,
    } = body

    // Validate required fields
    if (!offerId || !workshopId || !appointmentDate) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Get offer and verify it's accepted
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        tireRequest: true,
        tireOptions: true
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    if (offer.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Angebot wurde nicht angenommen' },
        { status: 400 }
      )
    }

    if (offer.tireRequest.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Check if booking already exists for this offer
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tireRequestId: offer.tireRequestId
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Für diese Anfrage existiert bereits eine Buchung' },
        { status: 400 }
      )
    }

    // Calculate duration (default 60 minutes)
    let estimatedDuration = 60
    if (appointmentEndTime) {
      const start = new Date(appointmentDate)
      const end = new Date(appointmentEndTime)
      estimatedDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    }

    // Fetch complete offer with all relations for emails
    const completeOffer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        tireRequest: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        workshop: {
          include: {
            user: true
          }
        },
        tireOptions: true
      }
    })

    if (!completeOffer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Determine selected tire option
    let selectedTireOption = null
    if (selectedTireOptionId && offer.tireOptions) {
      selectedTireOption = offer.tireOptions.find(opt => opt.id === selectedTireOptionId)
    }
    // Fallback to first option if not specified
    if (!selectedTireOption && offer.tireOptions && offer.tireOptions.length > 0) {
      selectedTireOption = offer.tireOptions[0]
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        workshopId: workshopId,
        offerId: offerId,
        tireRequestId: offer.tireRequestId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime: new Date(appointmentDate).toTimeString().substring(0, 5),
        estimatedDuration: estimatedDuration,
        status: 'CONFIRMED',
        paymentMethod: paymentMethod || 'PAY_ONSITE',
        customerNotes: customerMessage,
        selectedTireOptionId: selectedTireOption?.id,
      },
      include: {
        workshop: {
          include: {
            user: true
          }
        },
        tireRequest: true
      }
    })

    // Update tire request status
    await prisma.tireRequest.update({
      where: { id: offer.tireRequestId },
      data: { status: 'BOOKED' }
    })

    // Prepare data for emails
    const tireSize = `${completeOffer.tireRequest.width}/${completeOffer.tireRequest.aspectRatio} R${completeOffer.tireRequest.diameter}`
    const appointmentDateFormatted = new Date(appointmentDate).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const appointmentTimeFormatted = new Date(appointmentDate).toTimeString().substring(0, 5)

    // Send confirmation email to customer
    try {
      const customerEmailData = bookingConfirmationCustomerEmailTemplate({
        customerName: `${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}`,
        workshopName: completeOffer.workshop.companyName,
        workshopAddress: `${completeOffer.workshop.user.street}, ${completeOffer.workshop.user.zipCode} ${completeOffer.workshop.user.city}`,
        workshopPhone: completeOffer.workshop.user.phone || 'Nicht angegeben',
        workshopEmail: completeOffer.workshop.user.email,
        appointmentDate: appointmentDateFormatted,
        appointmentTime: appointmentTimeFormatted,
        tireBrand: completeOffer.tireBrand,
        tireModel: completeOffer.tireModel,
        tireSize: tireSize,
        totalPrice: completeOffer.price,
        paymentMethod: paymentMethod || 'PAY_ONSITE',
        bookingId: booking.id,
        customerNotes: customerMessage
      })

      await sendEmail({
        to: completeOffer.tireRequest.customer.user.email,
        subject: customerEmailData.subject,
        html: customerEmailData.html
      })
    } catch (emailError) {
      console.error('Failed to send customer confirmation email:', emailError)
      // Continue even if email fails
    }

    // Send notification email to workshop
    try {
      // Use selected tire option or fallback to main offer data
      const tireBrand = selectedTireOption?.brand || completeOffer.tireBrand
      const tireModel = selectedTireOption?.model || completeOffer.tireModel
      
      const workshopEmailData = bookingConfirmationWorkshopEmailTemplate({
        workshopName: completeOffer.workshop.companyName,
        customerName: `${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}`,
        customerPhone: completeOffer.tireRequest.customer.user.phone || 'Nicht angegeben',
        customerEmail: completeOffer.tireRequest.customer.user.email,
        customerAddress: `${completeOffer.tireRequest.customer.user.street || ''}, ${completeOffer.tireRequest.customer.user.zipCode || ''} ${completeOffer.tireRequest.customer.user.city || ''}`,
        appointmentDate: appointmentDateFormatted,
        appointmentTime: appointmentTimeFormatted,
        tireBrand: tireBrand,
        tireModel: tireModel,
        tireSize: tireSize,
        quantity: completeOffer.tireRequest.quantity,
        totalPrice: completeOffer.price,
        paymentMethod: paymentMethod || 'PAY_ONSITE',
        bookingId: booking.id,
        customerNotes: customerMessage
      })

      await sendEmail({
        to: completeOffer.workshop.user.email,
        subject: workshopEmailData.subject,
        html: workshopEmailData.html
      })
    } catch (emailError) {
      console.error('Failed to send workshop notification email:', emailError)
      // Continue even if email fails
    }

    // Create Google Calendar event if workshop has calendar connected
    let calendarEventId = null
    if (completeOffer.workshop.googleAccessToken && completeOffer.workshop.googleRefreshToken && completeOffer.workshop.googleCalendarId) {
      try {
        const { createCalendarEvent } = await import('@/lib/google-calendar')
        
        const appointmentStart = new Date(appointmentDate)
        const appointmentEnd = new Date(appointmentStart.getTime() + estimatedDuration * 60000)
        
        const tireBrand = selectedTireOption?.brand || completeOffer.tireBrand
        const tireModel = selectedTireOption?.model || completeOffer.tireModel
        const customerAddress = `${completeOffer.tireRequest.customer.user.street || ''}, ${completeOffer.tireRequest.customer.user.zipCode || ''} ${completeOffer.tireRequest.customer.user.city || ''}`
        
        const calendarEvent = await createCalendarEvent(
          completeOffer.workshop.googleAccessToken,
          completeOffer.workshop.googleRefreshToken,
          completeOffer.workshop.googleCalendarId,
          {
            summary: `Reifenwechsel - ${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}`,
            description: `Reifenwechsel für ${tireBrand} ${tireModel}\n\nKunde: ${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}\nAdresse: ${customerAddress}\nTelefon: ${completeOffer.tireRequest.customer.user.phone || 'Nicht angegeben'}\nEmail: ${completeOffer.tireRequest.customer.user.email}\n\nReifen: ${tireSize}\nMenge: ${completeOffer.tireRequest.quantity}\nGesamtpreis: ${completeOffer.price.toFixed(2)} €\n\n${customerMessage ? `Hinweise vom Kunden:\n${customerMessage}` : ''}`,
            start: appointmentStart.toISOString(),
            end: appointmentEnd.toISOString(),
            attendees: [{ email: completeOffer.tireRequest.customer.user.email }]
          }
        )
        
        calendarEventId = calendarEvent.id || null
        
        // Update booking with calendar event ID
        if (calendarEventId) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: calendarEventId }
          })
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError)
        // Continue even if calendar creation fails
      }
    }

    return NextResponse.json({
      message: 'Buchung erfolgreich erstellt',
      booking: {
        id: booking.id,
        appointmentDate: booking.appointmentDate.toISOString(),
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        googleEventId: calendarEventId
      }
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Buchung' },
      { status: 500 }
    )
  }
}
