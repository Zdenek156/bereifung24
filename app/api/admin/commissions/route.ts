import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commissions = await prisma.commission.findMany({
      include: {
        booking: {
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
            offer: {
              select: {
                price: true
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
            paypalEmail: true,
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

    const formattedCommissions = commissions.map(commission => ({
      id: commission.id,
      bookingId: commission.bookingId,
      orderTotal: commission.orderTotal,
      commissionRate: commission.commissionRate,
      commissionAmount: commission.commissionAmount,
      status: commission.status,
      billedAt: commission.billedAt,
      collectedAt: commission.collectedAt,
      sepaReference: commission.sepaReference,
      sepaStatus: commission.sepaStatus,
      notes: commission.notes,
      createdAt: commission.createdAt,
      workshop: {
        id: commission.workshop.id,
        companyName: commission.workshop.companyName,
        contactName: `${commission.workshop.user.firstName} ${commission.workshop.user.lastName}`,
        email: commission.workshop.user.email,
        iban: commission.workshop.iban,
        accountHolder: commission.workshop.accountHolder,
        paypalEmail: commission.workshop.paypalEmail
      },
      customer: {
        name: `${commission.booking.customer.user.firstName} ${commission.booking.customer.user.lastName}`,
        email: commission.booking.customer.user.email
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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commissionId, status, sepaStatus, notes } = body

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

    return NextResponse.json({ commission: updatedCommission })

  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
