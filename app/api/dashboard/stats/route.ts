import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Finde den Customer-Eintrag für diesen User
    const customer = await prisma.customer.findUnique({
      where: {
        userId: userId
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customerId = customer.id

    // Zähle offene Anfragen (Status: OPEN oder OFFERS_RECEIVED)
    const openRequests = await prisma.tireRequest.count({
      where: {
        customerId: customerId,
        status: {
          in: ['OPEN', 'OFFERS_RECEIVED']
        }
      }
    })

    // Zähle erhaltene Angebote (nur Anfragen mit OFFERS_RECEIVED Status)
    const receivedOffers = await prisma.tireRequest.count({
      where: {
        customerId: customerId,
        status: 'OFFERS_RECEIVED'
      }
    })

    // Zähle bevorstehende Termine (Bookings mit Status CONFIRMED oder PENDING, Datum in der Zukunft)
    const upcomingAppointments = await prisma.booking.count({
      where: {
        tireRequest: {
          customerId: customerId
        },
        status: {
          in: ['CONFIRMED', 'PENDING']
        },
        appointmentDate: {
          gte: new Date()
        }
      }
    })

    // Zähle gespeicherte Fahrzeuge
    const savedVehicles = await prisma.vehicle.count({
      where: {
        customerId: customerId
      }
    })

    return NextResponse.json({
      openRequests,
      receivedOffers,
      upcomingAppointments,
      savedVehicles
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
