import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tire-history - Get tire purchase history for current customer
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

    // Get all completed bookings with tire information
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: customer.id,
        status: 'COMPLETED'
      },
      include: {
        workshop: {
          include: {
            user: {
              select: {
                city: true
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
            loadIndex: true,
            speedRating: true,
            quantity: true
          }
        },
        offer: {
          select: {
            price: true,
            tireBrand: true,
            tireModel: true
          }
        },
        tireRating: {
          select: {
            id: true,
            rating: true,
            comment: true,
            quietnessRating: true,
            gripRating: true,
            wearRating: true,
            comfortRating: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Format response
    const history = bookings.map((booking: any) => ({
      id: booking.id,
      purchaseDate: (booking.completedAt || booking.appointmentDate).toISOString(),
      workshop: {
        companyName: booking.workshop.companyName,
        city: booking.workshop.user.city || 'Unbekannt'
      },
      tireDetails: {
        season: booking.tireRequest.season,
        brand: booking.offer?.tireBrand || null,
        model: booking.offer?.tireModel || null,
        width: booking.tireRequest.width,
        aspectRatio: booking.tireRequest.aspectRatio,
        diameter: booking.tireRequest.diameter,
        loadIndex: booking.tireRequest.loadIndex,
        speedRating: booking.tireRequest.speedRating,
        quantity: booking.tireRequest.quantity
      },
      vehicle: null, // TireRequest hat kein vehicleId
      price: booking.offer?.price || null,
      status: booking.status,
      tireRating: booking.tireRating ? {
        id: booking.tireRating.id,
        rating: booking.tireRating.rating,
        comment: booking.tireRating.comment,
        quietnessRating: booking.tireRating.quietnessRating,
        gripRating: booking.tireRating.gripRating,
        wearRating: booking.tireRating.wearRating,
        comfortRating: booking.tireRating.comfortRating
      } : null
    }))

    return NextResponse.json(history)
  } catch (error) {
    console.error('Tire history GET error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Reifenhistorie' },
      { status: 500 }
    )
  }
}
