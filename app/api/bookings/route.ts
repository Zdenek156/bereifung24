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
