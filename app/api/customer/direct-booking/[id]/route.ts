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
            phoneNumber: true,
            email: true,
            openingHours: true
          }
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlate: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
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

    return NextResponse.json({
      success: true,
      directBooking
    })

  } catch (error) {
    console.error('Error getting direct booking:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchung' },
      { status: 500 }
    )
  }
}
