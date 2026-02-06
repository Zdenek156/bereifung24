import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/direct-booking/[id]/available-slots
 * Get busy slots for a workshop (public API - no auth required)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start- und Enddatum fehlen' },
        { status: 400 }
      )
    }

    // Get Workshop directly (params.id is workshopId)
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get busy slots from existing bookings for this workshop
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        workshopId: params.id,
        appointmentDate: {
          gte: start,
          lte: end
        },
        status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING'] }
      },
      select: {
        appointmentDate: true,
        appointmentTime: true,
        estimatedDuration: true
      }
    })

    // Group busy slots by date
    const busySlotsByDate: Record<string, string[]> = {}
    
    existingBookings.forEach(booking => {
      const dateStr = booking.appointmentDate.toISOString().split('T')[0]
      if (!busySlotsByDate[dateStr]) {
        busySlotsByDate[dateStr] = []
      }
      busySlotsByDate[dateStr].push(booking.appointmentTime)
    })

    // Return busy slots grouped by date (client will generate available slots)
    return NextResponse.json({
      success: true,
      availableSlots: [], // Client generates based on workshop hours
      busySlots: busySlotsByDate
    })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zeitslots' },
      { status: 500 }
    )
  }
}
