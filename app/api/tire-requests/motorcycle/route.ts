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
  frontTire: z.object({
    width: z.number().min(80).max(240),
    aspectRatio: z.number().min(25).max(85),
    diameter: z.number().min(10).max(24),
    speedRating: z.string().optional(),
  }),
  rearTire: z.object({
    width: z.number().min(80).max(240),
    aspectRatio: z.number().min(25).max(85),
    diameter: z.number().min(10).max(24),
    speedRating: z.string().optional(),
  }),
  bothTires: z.boolean().default(true),
  needsFrontTire: z.boolean().default(true),
  needsRearTire: z.boolean().default(true),
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

    // Create tire request for motorcycle
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: null,
        season: validatedData.season,
        // Store front tire dimensions as primary
        width: validatedData.frontTire.width,
        aspectRatio: validatedData.frontTire.aspectRatio,
        diameter: validatedData.frontTire.diameter,
        speedRating: validatedData.frontTire.speedRating || '',
        quantity,
        preferredBrands: validatedData.preferredBrands || '',
        additionalNotes: [
          '🏍️ MOTORRADREIFEN',
          `Motorrad: ${validatedData.motorcycleMake} ${validatedData.motorcycleModel}`,
          `Reifentyp: ${seasonMap[validatedData.season]}`,
          '',
          validatedData.needsFrontTire ? `✓ Vorderreifen: ${validatedData.frontTire.width}/${validatedData.frontTire.aspectRatio} R${validatedData.frontTire.diameter}${validatedData.frontTire.speedRating ? ' ' + validatedData.frontTire.speedRating : ''}` : '',
          validatedData.needsRearTire ? `✓ Hinterreifen: ${validatedData.rearTire.width}/${validatedData.rearTire.aspectRatio} R${validatedData.rearTire.diameter}${validatedData.rearTire.speedRating ? ' ' + validatedData.rearTire.speedRating : ''}` : '',
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

    // Find nearby workshops
    const nearbyWorkshops = await prisma.$queryRaw<Array<{
      id: string;
      companyName: string;
      distance: number;
    }>>`
      SELECT * FROM (
        SELECT 
          w.id,
          w."companyName",
          (
            6371 * acos(
              cos(radians(${latitude})) * cos(radians(u.latitude)) *
              cos(radians(u.longitude) - radians(${longitude})) +
              sin(radians(${latitude})) * sin(radians(u.latitude))
            )
          ) AS distance
        FROM workshops w
        INNER JOIN users u ON w."userId" = u.id
        WHERE u."isActive" = true
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
      ) AS workshops_with_distance
      WHERE distance <= ${validatedData.radiusKm}
      ORDER BY distance
      LIMIT 20
    `

    // Send email notifications
    for (const workshop of nearbyWorkshops) {
      const workshopWithUser = await prisma.workshop.findUnique({
        where: { id: workshop.id },
        include: { user: true }
      })

      if (workshopWithUser?.user.email) {
        try {
          await sendEmail({
            to: workshopWithUser.user.email,
            subject: '🏍️ Neue Motorradreifen-Anfrage in Ihrer Nähe',
            html: `
              <h2>Neue Motorradreifen-Anfrage</h2>
              <p>Hallo ${workshopWithUser.companyName},</p>
              <p>Es gibt eine neue Motorradreifen-Anfrage in Ihrer Nähe (${workshop.distance.toFixed(1)} km).</p>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>Motorrad:</strong> ${validatedData.motorcycleMake} ${validatedData.motorcycleModel}</li>
                <li><strong>Reifentyp:</strong> ${seasonMap[validatedData.season]}</li>
                ${validatedData.needsFrontTire ? `<li><strong>Vorderreifen:</strong> ${validatedData.frontTire.width}/${validatedData.frontTire.aspectRatio} R${validatedData.frontTire.diameter}</li>` : ''}
                ${validatedData.needsRearTire ? `<li><strong>Hinterreifen:</strong> ${validatedData.rearTire.width}/${validatedData.rearTire.aspectRatio} R${validatedData.rearTire.diameter}</li>` : ''}
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
      workshopsNotified: nearbyWorkshops.length,
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
