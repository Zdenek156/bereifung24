import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Alle Offers
    const offers = await prisma.offer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Alle Bookings  
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Alle Commissions
    const commissions = await prisma.commission.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      summary: {
        totalOffers: offers.length,
        totalBookings: bookings.length,
        totalCommissions: commissions.length,
        offersAccepted: offers.filter(o => o.status === 'ACCEPTED').length,
        bookingsCompleted: bookings.filter(b => b.status === 'COMPLETED').length
      },
      offers: offers.map(o => ({
        id: o.id,
        status: o.status,
        price: o.price,
        createdAt: o.createdAt,
        workshopId: o.workshopId,
        tireRequestId: o.tireRequestId
      })),
      bookings: bookings.map(b => ({
        id: b.id,
        status: b.status,
        appointmentDate: b.appointmentDate,
        createdAt: b.createdAt,
        offerId: b.offerId,
        workshopId: b.workshopId,
        customerId: b.customerId
      })),
      commissions: commissions.map(c => ({
        id: c.id,
        commissionAmount: c.commissionAmount,
        commissionRate: c.commissionRate,
        status: c.status,
        billingMonth: c.billingMonth,
        billingYear: c.billingYear,
        dueDate: c.billingPeriodEnd,
        billedAt: c.billedAt,
        collectedAt: c.collectedAt,
        bookingId: c.bookingId
      }))
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Abrufen der Daten',
      details: error.message 
    }, { status: 500 })
  }
}
