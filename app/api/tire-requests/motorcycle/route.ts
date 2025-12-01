import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const motorcycleRequestSchema = z.object({
  motorcycleMake: z.string().min(2, 'Bitte Hersteller angeben'),
  motorcycleModel: z.string().min(2, 'Bitte Modell angeben'),
  season: z.enum(['SUMMER', 'WINTER', 'ALL_SEASON']),
  tireType: z.enum(['STANDARD', 'SPORT', 'TOURING', 'OFF_ROAD']).optional(),
  frontTire: z.object({
    width: z.number().min(70).max(400), // Full motorcycle range
    aspectRatio: z.number().min(25).max(100),
    diameter: z.number().min(8).max(26), // Extended diameter range
    loadIndex: z.number().optional(),
    speedRating: z.string().optional(),
  }).optional(),
  rearTire: z.object({
    width: z.number().min(70).max(400), // Full motorcycle range
    aspectRatio: z.number().min(25).max(100),
    diameter: z.number().min(8).max(26), // Extended diameter range
    loadIndex: z.number().optional(),
    speedRating: z.string().optional(),
  }).optional(),
  bothTires: z.boolean().default(true),
  needsFrontTire: z.boolean().default(true),
  needsRearTire: z.boolean().default(true),
  tireQuality: z.enum(['ECONOMY', 'MIDDLE', 'PREMIUM', 'QUALITY', 'BUDGET']).optional(),
  tireDisposal: z.boolean().optional(),
  preferredBrands: z.string().optional(),
  needByDate: z.string(),
  radiusKm: z.number().min(5).max(100),
  additionalNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Motorcycle request body:', JSON.stringify(body, null, 2))
    
    try {
      const validatedData = motorcycleRequestSchema.parse(body)
    } catch (validationError) {
      console.error('Validation error:', validationError)
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validationError },
        { status: 400 }
      )
    }
    
    const validatedData = motorcycleRequestSchema.parse(body)

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: session.user.customerId! },
      include: { user: true }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Geocode customer address
    let latitude: number | null = null
    let longitude: number | null = null
    let city: string | null = null

    if (customer.user.street && customer.user.city) {
      const geocodeResult = await geocodeAddress(
        customer.user.street,
        customer.user.zipCode || '00000',
        customer.user.city
      )
      
      if (geocodeResult) {
        latitude = geocodeResult.latitude
        longitude = geocodeResult.longitude
        city = geocodeResult.city || customer.user.city
      } else {
        console.warn(`Failed to geocode address for customer ${customer.id}`)
        city = customer.user.city
      }
    } else {
      city = customer.user.city
    }

    const seasonMap = {
      SUMMER: 'Sommerreifen',
      WINTER: 'Winterreifen',
      ALL_SEASON: 'Ganzjahresreifen'
    }

    // Determine quantity
    let quantity = 0
    if (validatedData.needsFrontTire) quantity++
    if (validatedData.needsRearTire) quantity++

    // Use front tire or rear tire dimensions as primary (whichever is available)
    const primaryTire = validatedData.frontTire || validatedData.rearTire
    if (!primaryTire) {
      return NextResponse.json(
        { error: 'Mindestens ein Reifen muss angegeben werden' },
        { status: 400 }
      )
    }

    // Create tire request for motorcycle
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: null,
        season: validatedData.season,
        // Store primary tire dimensions
        width: primaryTire.width,
        aspectRatio: primaryTire.aspectRatio,
        diameter: primaryTire.diameter,
        speedRating: primaryTire.speedRating || '',
        quantity,
        preferredBrands: validatedData.preferredBrands || '',
        additionalNotes: [
          '🏍️ MOTORRADREIFEN',
          `Motorrad: ${validatedData.motorcycleMake} ${validatedData.motorcycleModel}`,
          `Saison: ${seasonMap[validatedData.season]}`,
          validatedData.tireType ? `Reifentyp: ${validatedData.tireType === 'STANDARD' ? 'Standard' : validatedData.tireType === 'SPORT' ? 'Sport' : validatedData.tireType === 'TOURING' ? 'Touring' : 'Off-Road'}` : '',
          '',
          validatedData.needsFrontTire && validatedData.frontTire ? `✓ Vorderreifen: ${validatedData.frontTire.width}/${validatedData.frontTire.aspectRatio} R${validatedData.frontTire.diameter}${validatedData.frontTire.loadIndex ? ' ' + validatedData.frontTire.loadIndex : ''}${validatedData.frontTire.speedRating ? ' ' + validatedData.frontTire.speedRating : ''}` : '',
          validatedData.needsRearTire && validatedData.rearTire ? `✓ Hinterreifen: ${validatedData.rearTire.width}/${validatedData.rearTire.aspectRatio} R${validatedData.rearTire.diameter}${validatedData.rearTire.loadIndex ? ' ' + validatedData.rearTire.loadIndex : ''}${validatedData.rearTire.speedRating ? ' ' + validatedData.rearTire.speedRating : ''}` : '',
          '',
          validatedData.preferredBrands ? `Bevorzugte Marken: ${validatedData.preferredBrands}` : '',
          validatedData.additionalNotes ? `Anmerkungen: ${validatedData.additionalNotes}` : '',
        ].filter(Boolean).join('\n'),
        zipCode: customer.user.zipCode || '00000',
        city: city || customer.user.city || '',
        radiusKm: validatedData.radiusKm,
        needByDate: new Date(validatedData.needByDate),
        latitude,
        longitude,
        status: 'OPEN',
      },
    })

    // Get nearby workshops that offer motorcycle tire service
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'MOTORCYCLE_TIRE',
            isActive: true
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      take: 20
    })

    // Send email notifications to workshops
    for (const workshop of workshops) {
      if (workshop.user.email) {
        // Prüfe ob Werkstatt Benachrichtigungen aktiviert hat
        if (!workshop.emailNotifyRequests) {
          console.log(`⏭️  Workshop ${workshop.id} has disabled new request notifications`)
          continue
        }

        try {
          await sendEmail({
            to: workshop.user.email,
            subject: '🏍️ Neue Motorradreifen-Anfrage',
            html: `
              <h2>Neue Motorradreifen-Anfrage</h2>
              <p>Hallo ${workshop.companyName},</p>
              <p>Es gibt eine neue Motorradreifen-Anfrage in Ihrer Nähe.</p>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>Motorrad:</strong> ${validatedData.motorcycleMake} ${validatedData.motorcycleModel}</li>
                <li><strong>Saison:</strong> ${seasonMap[validatedData.season]}</li>
                ${validatedData.tireType ? `<li><strong>Reifentyp:</strong> ${validatedData.tireType === 'STANDARD' ? 'Standard' : validatedData.tireType === 'SPORT' ? 'Sport' : validatedData.tireType === 'TOURING' ? 'Touring' : 'Off-Road'}</li>` : ''}
                ${validatedData.needsFrontTire && validatedData.frontTire ? `<li><strong>Vorderreifen:</strong> ${validatedData.frontTire.width}/${validatedData.frontTire.aspectRatio} R${validatedData.frontTire.diameter}</li>` : ''}
                ${validatedData.needsRearTire && validatedData.rearTire ? `<li><strong>Hinterreifen:</strong> ${validatedData.rearTire.width}/${validatedData.rearTire.aspectRatio} R${validatedData.rearTire.diameter}</li>` : ''}
                <li><strong>PLZ/Ort:</strong> ${customer.user.zipCode} ${city}</li>
                <li><strong>Benötigt bis:</strong> ${new Date(validatedData.needByDate).toLocaleDateString('de-DE')}</li>
              </ul>
              
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workshop/browse-requests" 
                   style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
                  Angebot erstellen
                </a>
              </p>
              
              <p>Mit freundlichen Grüßen,<br>Ihr Bereifung24 Team</p>
            `
          })
        } catch (emailError) {
          console.error(`Failed to send email to workshop ${workshop.id}:`, emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      requestId: tireRequest.id,
      workshopsNotified: workshops.length,
    })

  } catch (error) {
    console.error('Error creating motorcycle request:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json(
        { error: 'Ungültige Eingabedaten', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Anfrage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
