import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/direct-booking/[id]
 * Get DirectBooking details
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const directBooking = await prisma.directBooking.findUnique({
      where: { id: params.id },
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
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!directBooking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (directBooking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Convert Decimal fields to numbers for JSON serialization
    const bookingData = {
      ...directBooking,
      basePrice: Number(directBooking.basePrice),
      balancingPrice: directBooking.balancingPrice ? Number(directBooking.balancingPrice) : null,
      storagePrice: directBooking.storagePrice ? Number(directBooking.storagePrice) : null,
      totalPrice: Number(directBooking.totalPrice)
    }

    return NextResponse.json(bookingData)

  } catch (error) {
    console.error('Error getting direct booking:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchung' },
      { status: 500 }
    )
  }
}
