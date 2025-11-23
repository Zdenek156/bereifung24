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

    console.log('Creating offer with data:', {
      workshopId: workshop.id,
      tireRequestId: params.id,
      tireOptionsCount: validatedData.tireOptions.length,
      installationFee: validatedData.installationFee,
      validDays: validatedData.validDays
    })

    // Erstelle Angebot mit mehreren Reifen-Optionen
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validatedData.validDays)

    // Verwende erste Option für Hauptfelder (Kompatibilität)
    const firstOption = validatedData.tireOptions[0]
    const totalPrice = (firstOption.pricePerTire * tireRequest.quantity) + validatedData.installationFee

    console.log('About to create offer in database')
    
    let offer
    try {
      offer = await prisma.offer.create({
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
    console.log('Offer created successfully:', offer.id)
    } catch (dbError) {
      console.error('Database error creating offer:', dbError)
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`)
    }

    // Update TireRequest status zu QUOTED wenn erstes Angebot
    if (tireRequest.status === 'PENDING') {
      await prisma.tireRequest.update({
        where: { id: params.id },
        data: { status: 'QUOTED' }
      })
    }

    // Email an Kunde senden
    try {
      console.log('Preparing email - offer data:', {
        hasTireOptions: !!offer.tireOptions,
        tireOptionsLength: offer.tireOptions?.length,
        hasTireRequest: !!offer.tireRequest,
        hasCustomer: !!offer.tireRequest?.customer,
        hasWorkshop: !!offer.workshop
      })

      if (!offer.tireOptions || offer.tireOptions.length === 0) {
        throw new Error('No tire options found in offer')
      }

      const tireSpecs = `${offer.tireRequest.width}/${offer.tireRequest.aspectRatio} R${offer.tireRequest.diameter}`
      const firstOption = offer.tireOptions[0]
      const totalOfferPrice = (firstOption.pricePerTire * tireRequest.quantity) + validatedData.installationFee
      const priceDisplay = offer.tireOptions.length > 1 
        ? `ab ${totalOfferPrice.toFixed(2)} €`
        : `${totalOfferPrice.toFixed(2)} €`
      
      const emailTemplate = newOfferEmailTemplate({
        customerName: `${offer.tireRequest.customer.user.firstName} ${offer.tireRequest.customer.user.lastName}`,
        workshopName: offer.workshop.companyName,
        tireBrand: firstOption.brand,
        tireModel: firstOption.model,
        tireSpecs: tireSpecs,
        price: totalOfferPrice,
        requestId: offer.tireRequestId
      })

      await sendEmail({
        to: offer.tireRequest.customer.user.email,
        ...emailTemplate
      })
      
      console.log('Email sent successfully to:', offer.tireRequest.customer.user.email)
    } catch (emailError) {
      console.error('Email konnte nicht gesendet werden:', emailError)
      console.error('Email error details:', emailError instanceof Error ? emailError.stack : String(emailError))
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Angebots', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
