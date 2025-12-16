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
      select: {
        id: true,
        tireBrand: true,
        tireModel: true,
        description: true,
        price: true,
        pricePerTire: true,
        installationFee: true,
        validUntil: true,
        status: true,
        acceptedAt: true,
        declinedAt: true,
        createdAt: true,
        selectedTireOptionIds: true,
        tireOptions: true,
        booking: true,
        tireRequest: {
          select: {
            id: true,
            season: true,
            width: true,
            aspectRatio: true,
            diameter: true,
            quantity: true,
            zipCode: true,
            needByDate: true,
            additionalNotes: true,
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
                  },
                },
              },
            },
          },
        },
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
