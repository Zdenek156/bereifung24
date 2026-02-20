import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bookingService } from '@/lib/accounting/bookingService'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load DirectBookings with paid commissions
    const directBookings = await prisma.directBooking.findMany({
      where: {
        platformCommission: {
          not: null
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      include: {
        customer: {
          include: {
            user: {
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
            id: true,
            companyName: true,
            iban: true,
            accountHolder: true,
            stripeAccountId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format as commissions for frontend compatibility
    const formattedCommissions = directBookings.map(booking => ({
      id: booking.id,
      bookingId: booking.id,
      orderTotal: booking.totalPrice,
      commissionRate: 6.9, // Platform commission rate
      commissionAmount: booking.platformCommission,
      platformNetCommission: booking.platformNetCommission,
      stripeFeesEstimate: booking.stripeFeesEstimate,
      workshopPayout: booking.workshopPayout,
      status: booking.paymentStatus === 'PAID' ? 'COLLECTED' : 'PENDING',
      billedAt: booking.paidAt,
      collectedAt: booking.paidAt,
      sepaReference: booking.stripePaymentId,
      sepaStatus: booking.paymentStatus,
      notes: `${booking.serviceType} - ${booking.date.toISOString().split('T')[0]} ${booking.time}`,
      createdAt: booking.createdAt,
      workshop: {
        id: booking.workshop.id,
        companyName: booking.workshop.companyName,
        contactName: `${booking.workshop.user.firstName} ${booking.workshop.user.lastName}`,
        email: booking.workshop.user.email,
        iban: booking.workshop.iban,
        accountHolder: booking.workshop.accountHolder,
        stripeAccountId: booking.workshop.stripeAccountId
      },
      customer: {
        name: `${booking.customer.user.firstName} ${booking.customer.user.lastName}`,
        email: booking.customer.user.email
      }
    }))

    return NextResponse.json({ commissions: formattedCommissions })

  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commissionId, status, sepaStatus, notes } = body

    // Get current commission to check status change
    const currentCommission = await prisma.commission.findUnique({
      where: { id: commissionId }
    })

    if (!currentCommission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    const updatedCommission = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status,
        sepaStatus,
        notes,
        billedAt: status === 'BILLED' ? new Date() : undefined,
        collectedAt: status === 'COLLECTED' ? new Date() : undefined
      }
    })

    // NOTE: Auto-booking is now created monthly via SEPA payment webhook
    // Individual commission bookings are no longer created here

    return NextResponse.json({ commission: updatedCommission })

  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
