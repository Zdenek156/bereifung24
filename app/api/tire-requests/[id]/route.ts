import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tireRequest = await prisma.tireRequest.findFirst({
      where: {
        id: params.id,
        customerId: session.user.customerId!,
      },
      include: {
        customer: {
          select: {
            isCompany: true,
          },
        },
        offers: {
          include: {
            workshop: {
              include: {
                user: true,
              },
            },
            tireOptions: {
              orderBy: {
                pricePerTire: 'asc',
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Flatten workshop structure for easier access
    const formattedRequest = {
      ...tireRequest,
      offers: tireRequest.offers.map(offer => ({
        ...offer,
        workshop: {
          companyName: offer.workshop.companyName,
          logoUrl: offer.workshop.logoUrl,
          taxMode: offer.workshop.taxMode,
          calendarMode: offer.workshop.calendarMode,
          paypalEmail: offer.workshop.paypalEmail,
          stripeEnabled: offer.workshop.stripeEnabled,
          paymentMethods: offer.workshop.paymentMethods,
          street: offer.workshop.user.street,
          zipCode: offer.workshop.user.zipCode,
          city: offer.workshop.user.city,
          phone: offer.workshop.user.phone,
        },
      })),
    }

    return NextResponse.json({ request: formattedRequest })
  } catch (error) {
    console.error('Error fetching tire request:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
