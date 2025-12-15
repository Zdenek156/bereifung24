import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/offers - Get all offers for the workshop
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get workshop ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get all offers with related data
    const offers = await prisma.offer.findMany({
      where: { workshopId: user.workshop.id },
      include: {
        tireOptions: true,
        tireRequest: {
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    city: true,
                    zipCode: true,
                    street: true,
                    houseNumber: true,
                  },
                },
              },
            },
          },
        },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(offers)
  } catch (error) {
    console.error('Offers fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Angebote' },
      { status: 500 }
    )
  }
}
