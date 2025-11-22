import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, newOfferEmailTemplate } from '@/lib/email'

const tireOptionSchema = z.object({
  brand: z.string().min(1, 'Reifenmarke erforderlich'),
  model: z.string().min(1, 'Reifenmodell erforderlich'),
  pricePerTire: z.number().positive('Preis pro Reifen muss positiv sein')
})

const offerSchema = z.object({
  tireOptions: z.array(tireOptionSchema).min(1, 'Mindestens ein Reifenangebot erforderlich'),
  description: z.string().optional(),
  installationFee: z.number().min(0, 'Montagegebühr muss mindestens 0 sein'),
  validDays: z.number().int().min(1).max(30).default(7),
  durationMinutes: z.number().int().positive().optional()
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

    // Erstelle Angebot mit mehreren Reifen-Optionen
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validatedData.validDays)

    // Verwende erste Option für Hauptfelder (Kompatibilität)
    const firstOption = validatedData.tireOptions[0]
    const totalPrice = (firstOption.pricePerTire * tireRequest.quantity) + validatedData.installationFee

    const offer = await prisma.offer.create({
      data: {
        tireRequestId: params.id,
        workshopId: workshop.id,
        tireBrand: firstOption.brand,
        tireModel: firstOption.model,
        description: validatedData.description,
        pricePerTire: firstOption.pricePerTire,
        price: totalPrice,
        installationFee: validatedData.installationFee,
        durationMinutes: validatedData.durationMinutes,
        validUntil: validUntil,
        status: 'PENDING',
        tireOptions: {
          create: validatedData.tireOptions.map(option => ({
            brand: option.brand,
            model: option.model,
            pricePerTire: option.pricePerTire
          }))
        }
      },
      include: {
        tireOptions: true,
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

    // Email an Kunde senden
    try {
      const tireSpecs = `${offer.tireRequest.width}/${offer.tireRequest.aspectRatio} R${offer.tireRequest.diameter}`
      const firstOption = offer.tireOptions[0]
      const priceRange = offer.tireOptions.length > 1 
        ? `ab ${(firstOption.pricePerTire * tireRequest.quantity + validatedData.installationFee).toFixed(2)} €`
        : `${(firstOption.pricePerTire * tireRequest.quantity + validatedData.installationFee).toFixed(2)} €`
      
      const emailTemplate = newOfferEmailTemplate({
        customerName: `${offer.tireRequest.customer.user.firstName} ${offer.tireRequest.customer.user.lastName}`,
        workshopName: offer.workshop.companyName,
        tireBrand: firstOption.brand,
        tireModel: firstOption.model,
        tireSpecs: tireSpecs,
        price: parseFloat(priceRange.replace(/[^\d.]/g, '')),
        requestId: offer.tireRequestId
      })

      await sendEmail({
        to: offer.tireRequest.customer.user.email,
        ...emailTemplate
      })
    } catch (emailError) {
      console.error('Email konnte nicht gesendet werden:', emailError)
      // Weiter ausführen, auch wenn Email fehlschlägt
    }

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
