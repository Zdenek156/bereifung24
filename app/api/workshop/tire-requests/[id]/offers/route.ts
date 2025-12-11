import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, newOfferEmailTemplate, newServiceOfferEmailTemplate } from '@/lib/email'

const tireOptionSchema = z.object({
  brandModel: z.string().min(1, 'Reifenmarke und -modell erforderlich'),
  pricePerTire: z.number().positive('Preis pro Reifen muss positiv sein'),
  motorcycleTireType: z.enum(['FRONT', 'REAR', 'BOTH']).optional(), // Für Motorradreifen - pro Reifenangebot
  carTireType: z.enum(['ALL_FOUR', 'FRONT_TWO', 'REAR_TWO']).optional() // Für Autoreifen - pro Reifenangebot
})

// Helper function to calculate quantity based on car tire type
function getQuantityForCarTireType(carTireType?: 'ALL_FOUR' | 'FRONT_TWO' | 'REAR_TWO'): number {
  switch (carTireType) {
    case 'ALL_FOUR': return 4
    case 'FRONT_TWO': return 2
    case 'REAR_TWO': return 2
    default: return 4 // Default to 4 if not specified
  }
}

const offerSchema = z.object({
  tireOptions: z.array(tireOptionSchema).optional(), // Optional für Service-Anfragen
  description: z.string().optional(),
  installationFee: z.number().min(0, 'Montagegebühr muss mindestens 0 sein'),
  validDays: z.number().int().min(1).max(30).default(7),
  durationMinutes: z.number().int().positive().optional(),
  balancingPrice: z.number().min(0).optional(), // Wuchten-Preis für Wheel Change
  storagePrice: z.number().min(0).optional(), // Einlagerung-Preis für Wheel Change
  storageAvailable: z.boolean().optional() // Einlagerung verfügbar
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

    // Hole die Anfrage mit RunFlat-Info
    const tireRequest = await prisma.tireRequest.findUnique({
      where: { id: params.id },
      include: {
        customer: true
      }
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole Workshop-Service für RunFlat-Aufpreis (nur bei RunFlat-Reifen)
    let runFlatSurcharge = 0
    if (tireRequest.isRunflat) {
      const workshopService = await prisma.workshopService.findFirst({
        where: {
          workshopId: workshop.id,
          serviceType: 'TIRE_CHANGE'
        }
      })
      if (workshopService?.runFlatSurcharge) {
        runFlatSurcharge = workshopService.runFlatSurcharge
      }
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

    // Prüfe ob es eine Service-Anfrage ist (Räder-Wechsel)
    const isServiceRequest = tireRequest.width === 0 && tireRequest.aspectRatio === 0 && tireRequest.diameter === 0
    const hasValidTireOptions = validatedData.tireOptions && validatedData.tireOptions.length > 0

    // Validierung: Normale Reifenanfragen brauchen Reifenangebote
    if (!isServiceRequest && !hasValidTireOptions) {
      return NextResponse.json(
        { error: 'Mindestens ein Reifenangebot erforderlich' },
        { status: 400 }
      )
    }

    console.log('Creating offer with data:', {
      workshopId: workshop.id,
      tireRequestId: params.id,
      isServiceRequest,
      tireOptionsCount: hasValidTireOptions ? validatedData.tireOptions!.length : 0,
      installationFee: validatedData.installationFee,
      validDays: validatedData.validDays
    })

    // Erstelle Angebot mit mehreren Reifen-Optionen
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validatedData.validDays)

    // Für Service-Anfragen: Setze Preis auf installationFee, sonst 0 (Kunde wählt Option)
    // Der finale Preis wird basierend auf der gewählten Option beim Booking berechnet
    const totalPrice = isServiceRequest 
      ? validatedData.installationFee
      : 0 // Wird dynamisch beim Checkout berechnet

    console.log('Creating offer with multiple tire options:', {
      isServiceRequest,
      tireOptionsCount: hasValidTireOptions ? validatedData.tireOptions!.length : 0,
      installationFee: validatedData.installationFee,
      runFlatSurcharge,
      basePrice: totalPrice
    })
    
    console.log('About to create offer in database')
    
    let offer
    try {
      offer = await prisma.offer.create({
      data: {
        tireRequestId: params.id,
        workshopId: workshop.id,
        tireBrand: hasValidTireOptions ? validatedData.tireOptions![0].brandModel.split(' ')[0] : '',
        tireModel: hasValidTireOptions ? validatedData.tireOptions![0].brandModel.split(' ').slice(1).join(' ') || validatedData.tireOptions![0].brandModel : '',
        description: validatedData.description,
        pricePerTire: hasValidTireOptions ? validatedData.tireOptions![0].pricePerTire : 0,
        price: totalPrice,
        installationFee: validatedData.installationFee,
        durationMinutes: validatedData.durationMinutes,
        balancingPrice: validatedData.balancingPrice,
        storagePrice: validatedData.storagePrice,
        storageAvailable: validatedData.storageAvailable,
        motorcycleTireType: validatedData.tireOptions?.[0]?.motorcycleTireType || null, // Keep for backward compatibility
        validUntil: validUntil,
        status: 'PENDING',
        ...(hasValidTireOptions && {
          tireOptions: {
            create: validatedData.tireOptions!.map(option => {
              const parts = option.brandModel.split(' ')
              return {
                brand: parts[0] || option.brandModel,
                model: parts.slice(1).join(' ') || '',
                pricePerTire: option.pricePerTire,
                motorcycleTireType: option.motorcycleTireType,
                carTireType: option.carTireType
              }
            })
          }
        })
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

      // Extract motorcycle tire info if applicable
      const isMotorcycle = offer.tireRequest.additionalNotes?.includes('🏍️ MOTORRADREIFEN')
      let tireSpecs = `${offer.tireRequest.width}/${offer.tireRequest.aspectRatio} R${offer.tireRequest.diameter}`
      
      if (isMotorcycle && offer.tireRequest.additionalNotes) {
        const frontMatch = offer.tireRequest.additionalNotes.match(/✓ Vorderreifen: (\d+)\/(\d+) R(\d+)(\s+\w+)?/)
        const rearMatch = offer.tireRequest.additionalNotes.match(/✓ Hinterreifen: (\d+)\/(\d+) R(\d+)(\s+\w+)?/)
        
        if (frontMatch && rearMatch) {
          tireSpecs = `Vorne: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] || ''} • Hinten: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] || ''}`
        } else if (frontMatch) {
          tireSpecs = `Vorderreifen: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] || ''}`
        } else if (rearMatch) {
          tireSpecs = `Hinterreifen: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] || ''}`
        }
      }
      
      // Prüfe ob es eine Service-Anfrage ist (Bremsen, Batterie, etc.)
      const isBrakeService = tireRequest.additionalNotes?.includes('BREMSEN-SERVICE')
      const isBatteryService = tireRequest.additionalNotes?.includes('BATTERIE-SERVICE')
      const isOtherService = tireRequest.additionalNotes?.includes('🔧 SONSTIGE REIFENSERVICES')
      const isAnyServiceRequest = isBrakeService || isBatteryService || isOtherService
      
      let emailTemplate
      
      if (isAnyServiceRequest) {
        // Service-Anfrage (Bremsen, Batterie, Sonstige)
        let serviceType = 'Service'
        let serviceDescription = ''
        
        if (isBrakeService) {
          serviceType = 'Bremsen-Service'
          // Extrahiere Bremsenpakete aus additionalNotes
          const notes = tireRequest.additionalNotes || ''
          const frontMatch = notes.match(/Vorderachse:\s*(.+?)(?:\n|$)/)
          const rearMatch = notes.match(/Hinterachse:\s*(.+?)(?:\n|$)/)
          
          const packages: string[] = []
          if (frontMatch && frontMatch[1] && frontMatch[1].trim() !== 'Keine Arbeiten') {
            packages.push(`Vorderachse: ${frontMatch[1].trim()}`)
          }
          if (rearMatch && rearMatch[1] && rearMatch[1].trim() !== 'Keine Arbeiten') {
            packages.push(`Hinterachse: ${rearMatch[1].trim()}`)
          }
          
          serviceDescription = packages.join(' • ')
        } else if (isBatteryService) {
          serviceType = 'Batterie-Service'
          serviceDescription = 'Batteriewechsel inkl. Überprüfung'
        } else if (isOtherService) {
          serviceType = 'Sonstige Services'
          // Extrahiere Servicebeschreibung aus additionalNotes
          const notes = tireRequest.additionalNotes || ''
          const descMatch = notes.match(/Beschreibung:\s*(.+?)(?:\n|$)/s)
          if (descMatch && descMatch[1]) {
            serviceDescription = descMatch[1].trim()
          }
        }
        
        emailTemplate = newServiceOfferEmailTemplate({
          customerName: `${offer.tireRequest.customer.user.firstName} ${offer.tireRequest.customer.user.lastName}`,
          workshopName: offer.workshop.companyName,
          serviceType,
          serviceDescription,
          price: validatedData.installationFee,
          durationMinutes: validatedData.durationMinutes || 60,
          requestId: offer.tireRequestId
        })
      } else {
        // Normale Reifenanfrage
        const firstOption = offer.tireOptions[0]
        // Calculate with quantity from carTireType
        const firstOptionQuantity = firstOption.carTireType ? 
          getQuantityForCarTireType(firstOption.carTireType as 'ALL_FOUR' | 'FRONT_TWO' | 'REAR_TWO') : 
          tireRequest.quantity
        const firstOptionRunFlat = runFlatSurcharge * firstOptionQuantity
        const totalOfferPrice = (firstOption.pricePerTire * firstOptionQuantity) + validatedData.installationFee + firstOptionRunFlat
        const priceDisplay = offer.tireOptions.length > 1 
          ? `ab ${totalOfferPrice.toFixed(2)} €`
          : `${totalOfferPrice.toFixed(2)} €`
        
        emailTemplate = newOfferEmailTemplate({
          customerName: `${offer.tireRequest.customer.user.firstName} ${offer.tireRequest.customer.user.lastName}`,
          workshopName: offer.workshop.companyName,
          tireOptions: offer.tireOptions,
          tireSpecs: tireSpecs,
          price: totalOfferPrice,
          requestId: offer.tireRequestId,
          quantity: tireRequest.quantity,
          installationFee: validatedData.installationFee
        })
      }

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
