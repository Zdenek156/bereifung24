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

    // Delete in correct order (child records first, then parents)
    
    // 1. Delete commissions first (they reference bookings)
    if (deleteBookings || deleteOffers || deleteTireRequests) {
      const commissionResult = await prisma.commission.deleteMany({})
      results.deletedCounts.commissions = commissionResult.count
    }

    // 2. Delete reviews (they reference bookings)
    if (deleteBookings || deleteOffers || deleteTireRequests) {
      const reviewResult = await prisma.review.deleteMany({})
      results.deletedCounts.reviews = reviewResult.count
    }

    // 3. Delete tire ratings (they reference bookings)
    if (deleteBookings || deleteOffers || deleteTireRequests) {
      const tireRatingResult = await prisma.tireRating.deleteMany({})
      results.deletedCounts.tireRatings = tireRatingResult.count
    }

    // 4. Delete bookings (they reference offers)
    if (deleteBookings || deleteOffers || deleteTireRequests) {
      const bookingResult = await prisma.booking.deleteMany({})
      results.deletedCounts.bookings = bookingResult.count
    }

    // 5. Delete offers (they reference tire requests)
    if (deleteOffers || deleteTireRequests) {
      const offerResult = await prisma.offer.deleteMany({})
      results.deletedCounts.offers = offerResult.count
    }

    // 6. Delete tire requests (now safe as no references exist)
    if (deleteTireRequests) {
      const tireRequestResult = await prisma.tireRequest.deleteMany({})
      results.deletedCounts.tireRequests = tireRequestResult.count
    }

    // 7. Delete vehicles (independent)
    if (deleteVehicles) {
      const vehicleResult = await prisma.vehicle.deleteMany({})
      results.deletedCounts.vehicles = vehicleResult.count
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
