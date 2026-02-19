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
            companyName: true,
            user: {
              select: {
                email: true,
                phone: true,
                street: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            licensePlate: true,
            year: true
          }
        },
        customer: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
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

    // Verify ownership - check if the booking's customer belongs to the logged-in user
    if (directBooking.customer?.userId !== session.user.id) {
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
      disposalFee: directBooking.disposalFee ? Number(directBooking.disposalFee) : null,
      runFlatSurcharge: directBooking.runFlatSurcharge ? Number(directBooking.runFlatSurcharge) : null,
      totalTirePurchasePrice: directBooking.totalTirePurchasePrice ? Number(directBooking.totalTirePurchasePrice) : null,
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
