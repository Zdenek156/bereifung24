import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Nur für Kunden
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Alle Buchungen des Kunden abrufen
    const bookings = await prisma.directBooking.findMany({
      where: {
        customerId: session.user.id
      },
      include: {
        workshop: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            phone: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            year: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Decimal-Felder zu Numbers konvertieren
    const bookingsData = bookings.map(booking => ({
      ...booking,
      basePrice: Number(booking.basePrice),
      balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : null,
      storagePrice: booking.storagePrice ? Number(booking.storagePrice) : null,
      totalPrice: Number(booking.totalPrice)
    }))

    return NextResponse.json({
      success: true,
      bookings: bookingsData
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchungen' },
      { status: 500 }
    )
  }
}
