import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        tireRequest: true
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

    // TODO: Send confirmation email to customer and workshop
    // TODO: Add event to Google Calendar if connected

    return NextResponse.json({
      message: 'Buchung erfolgreich erstellt',
      booking: {
        id: booking.id,
        appointmentDate: booking.appointmentDate.toISOString(),
        appointmentTime: booking.appointmentTime,
        status: booking.status,
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
