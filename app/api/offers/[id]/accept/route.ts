import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// POST - Kunde nimmt Angebot an
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole das Angebot mit allen Relations
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        tireRequest: {
          include: {
            customer: true
          }
        },
        workshop: {
          include: {
            user: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob das Angebot zum Kunden gehört
    if (offer.tireRequest.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert für dieses Angebot' },
        { status: 403 }
      )
    }

    // Prüfe ob Angebot noch gültig ist
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Dieses Angebot kann nicht mehr angenommen werden' },
        { status: 400 }
      )
    }

    if (new Date(offer.validUntil) < new Date()) {
      return NextResponse.json(
        { error: 'Dieses Angebot ist abgelaufen' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein Angebot angenommen wurde
    const existingAcceptedOffer = await prisma.offer.findFirst({
      where: {
        tireRequestId: offer.tireRequestId,
        status: 'ACCEPTED'
      }
    })

    if (existingAcceptedOffer) {
      return NextResponse.json(
        { error: 'Sie haben bereits ein Angebot für diese Anfrage angenommen' },
        { status: 400 }
      )
    }

    // Transaktion: Angebot annehmen und alle anderen ablehnen
    const result = await prisma.$transaction(async (tx) => {
      // Aktualisiere das angenommene Angebot
      const acceptedOffer = await tx.offer.update({
        where: { id: params.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      })

      // Lehne alle anderen Angebote ab
      await tx.offer.updateMany({
        where: {
          tireRequestId: offer.tireRequestId,
          id: { not: params.id },
          status: 'PENDING'
        },
        data: {
          status: 'DECLINED'
        }
      })

      // Aktualisiere TireRequest Status
      await tx.tireRequest.update({
        where: { id: offer.tireRequestId },
        data: {
          status: 'ACCEPTED'
        }
      })

      return acceptedOffer
    })

    // TODO: Email an Werkstatt senden
    // sendEmail({
    //   to: offer.workshop.user.email,
    //   subject: 'Ihr Angebot wurde angenommen!',
    //   template: 'offer-accepted',
    //   data: { offer, customer: session.user }
    // })

    return NextResponse.json({
      message: 'Angebot erfolgreich angenommen',
      offer: result
    })

  } catch (error) {
    console.error('Offer acceptance error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Annehmen des Angebots' },
      { status: 500 }
    )
  }
}
