import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/bookings/[id] - Update booking (e.g., cancel)
export async function PATCH(
  req: NextRequest,
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

    const { id } = params
    const body = await req.json()
    const { status } = body

    // Get booking with customer info
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify user is the booking owner
    if (booking.customer.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Only allow cancellation
    if (status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Nur Stornierungen sind erlaubt' },
        { status: 400 }
      )
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    return NextResponse.json(
      { success: true, booking: updatedBooking },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
