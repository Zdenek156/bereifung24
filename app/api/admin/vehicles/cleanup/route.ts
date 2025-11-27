import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/cleanup - Selective cleanup (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await req.json()
    const { deleteVehicles, deleteTireRequests, deleteOffers, deleteBookings } = body

    const results: any = {
      success: true,
      deletedCounts: {}
    }

    // Delete vehicles
    if (deleteVehicles) {
      const vehicleResult = await prisma.vehicle.deleteMany({})
      results.deletedCounts.vehicles = vehicleResult.count
    }

    // Delete tire requests (and related offers/bookings will cascade)
    if (deleteTireRequests) {
      const tireRequestResult = await prisma.tireRequest.deleteMany({})
      results.deletedCounts.tireRequests = tireRequestResult.count
    }

    // Delete offers (if not already deleted via tire requests)
    if (deleteOffers && !deleteTireRequests) {
      const offerResult = await prisma.offer.deleteMany({})
      results.deletedCounts.offers = offerResult.count
    }

    // Delete bookings (if not already deleted via tire requests/offers)
    if (deleteBookings && !deleteTireRequests && !deleteOffers) {
      const bookingResult = await prisma.booking.deleteMany({})
      results.deletedCounts.bookings = bookingResult.count
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('POST /api/admin/cleanup error:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}
