import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Alle Bookings mit allen Details
    const bookings = await prisma.booking.findMany({
      include: {
        offer: {
          include: {
            tireRequest: {
              include: {
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            workshop: {
              select: {
                companyName: true,
                email: true
              }
            }
          }
        },
        commission: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Alle Offers
    const offers = await prisma.offer.findMany({
      include: {
        tireRequest: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        workshop: {
          select: {
            companyName: true,
            email: true
          }
        },
        booking: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Alle Commissions
    const commissions = await prisma.commission.findMany({
      include: {
        booking: {
          include: {
            offer: {
              include: {
                workshop: {
                  select: {
                    companyName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      summary: {
        totalBookings: bookings.length,
        totalOffers: offers.length,
        totalCommissions: commissions.length,
        bookingsWithCommission: bookings.filter(b => b.commission).length,
        bookingsWithoutCommission: bookings.filter(b => !b.commission).length
      },
      bookings: bookings.map(b => ({
        id: b.id,
        status: b.status,
        appointmentDate: b.appointmentDate,
        createdAt: b.createdAt,
        customer: b.offer.tireRequest.customer.firstName + ' ' + b.offer.tireRequest.customer.lastName,
        workshop: b.offer.workshop.companyName,
        totalPrice: b.offer.totalPrice,
        hasCommission: !!b.commission,
        commissionAmount: b.commission?.amount,
        commissionStatus: b.commission?.status
      })),
      offers: offers.map(o => ({
        id: o.id,
        status: o.status,
        totalPrice: o.totalPrice,
        createdAt: o.createdAt,
        customer: o.tireRequest.customer.firstName + ' ' + o.tireRequest.customer.lastName,
        workshop: o.workshop.companyName,
        hasBooking: !!o.booking,
        bookingId: o.booking?.id
      })),
      commissions: commissions.map(c => ({
        id: c.id,
        amount: c.amount,
        percentage: c.percentage,
        status: c.status,
        dueDate: c.dueDate,
        paidAt: c.paidAt,
        workshop: c.booking.offer.workshop.companyName,
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
