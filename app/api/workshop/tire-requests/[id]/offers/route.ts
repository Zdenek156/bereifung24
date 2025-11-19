import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const offerSchema = z.object({
  tireBrand: z.string().min(1, 'Reifenmarke erforderlich'),
  tireModel: z.string().min(1, 'Reifenmodell erforderlich'),
  description: z.string().optional(),
  pricePerTire: z.number().positive('Preis pro Reifen muss positiv sein'),
  installationFee: z.number().min(0, 'Montagegebühr muss mindestens 0 sein'),
  validDays: z.number().int().min(1).max(30).default(7)
})

// POST - Werkstatt erstellt Angebot für eine Anfrage
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole die Anfrage
    const tireRequest = await prisma.tireRequest.findUnique({
      where: { id: params.id }
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob bereits ein Angebot von dieser Werkstatt existiert
    const existingOffer = await prisma.offer.findFirst({
      where: {
        tireRequestId: params.id,
        workshopId: workshop.id
      }
    })

    if (existingOffer) {
      return NextResponse.json(
        { error: 'Sie haben bereits ein Angebot für diese Anfrage erstellt' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = offerSchema.parse(body)

    // Berechne Gesamtpreis
    const totalPrice = (validatedData.pricePerTire * tireRequest.quantity) + validatedData.installationFee

    // Erstelle Angebot
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validatedData.validDays)

    const offer = await prisma.offer.create({
      data: {
        tireRequestId: params.id,
        workshopId: workshop.id,
        tireBrand: validatedData.tireBrand,
        tireModel: validatedData.tireModel,
        description: validatedData.description,
        pricePerTire: validatedData.pricePerTire,
        installationFee: validatedData.installationFee,
        price: totalPrice,
        validUntil: validUntil,
        status: 'PENDING'
      },
      include: {
        tireRequest: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        workshop: {
          include: {
            user: true
          }
        }
      }
    })

    // Update TireRequest status zu QUOTED wenn erstes Angebot
    if (tireRequest.status === 'PENDING') {
      await prisma.tireRequest.update({
        where: { id: params.id },
        data: { status: 'QUOTED' }
      })
    }

    // TODO: Email an Kunde senden
    // sendEmail({
    //   to: offer.tireRequest.customer.user.email,
    //   subject: 'Neues Angebot für Ihre Reifenafrage',
    //   template: 'new-offer',
    //   data: { offer }
    // })

    return NextResponse.json({ 
      message: 'Angebot erfolgreich erstellt',
      offer 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Offer creation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Angebots' },
      { status: 500 }
    )
  }
}
