import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const repairRequestSchema = z.object({
  vehicleId: z.string().optional(),
  issueType: z.enum(['puncture', 'valve', 'other']),
  issueDescription: z.string().min(10, 'Bitte beschreiben Sie das Problem genauer'),
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
    const validatedData = repairRequestSchema.parse(body)

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

    // Geocode customer address if available
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

    // Map issue type to German
    const issueTypeMap = {
      puncture: 'Reifenpanne / Loch',
      valve: 'Ventil defekt',
      other: 'Sonstiges Problem'
    }

    // Create a tire request with dummy specs for repair service
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: validatedData.vehicleId || null,
        season: 'SUMMER', // Dummy value
        width: 0, // Dummy - indicates service request
        aspectRatio: 0,
        diameter: 0,
        quantity: 1, // Typically one tire to repair
        additionalNotes: [
          '🔧 REIFENREPARATUR',
          `Problem: ${issueTypeMap[validatedData.issueType]}`,
          `Beschreibung: ${validatedData.issueDescription}`,
          validatedData.additionalNotes ? `Zusätzliche Hinweise: ${validatedData.additionalNotes}` : '',
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
      SELECT 
        w.id,
        w."companyName",
        (
          6371 * acos(
            cos(radians(${latitude})) * cos(radians(w.latitude)) *
            cos(radians(w.longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(w.latitude))
          )
        ) AS distance
      FROM workshops w
      INNER JOIN users u ON w."userId" = u.id
      WHERE u.active = true
      AND w.latitude IS NOT NULL
      AND w.longitude IS NOT NULL
      HAVING distance <= ${validatedData.radiusKm}
      ORDER BY distance
      LIMIT 20
    `

    // Send email notifications to nearby workshops
    for (const workshop of nearbyWorkshops) {
      const workshopWithUser = await prisma.workshop.findUnique({
        where: { id: workshop.id },
        include: { user: true }
      })

      if (workshopWithUser?.user.email) {
        try {
          await sendEmail({
            to: workshopWithUser.user.email,
            subject: '🔧 Neue Reifenreparatur-Anfrage in Ihrer Nähe',
            html: `
              <h2>Neue Reifenreparatur-Anfrage</h2>
              <p>Hallo ${workshopWithUser.companyName},</p>
              <p>Es gibt eine neue Reifenreparatur-Anfrage in Ihrer Nähe (${workshop.distance.toFixed(1)} km).</p>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>Problem:</strong> ${issueTypeMap[validatedData.issueType]}</li>
                <li><strong>Beschreibung:</strong> ${validatedData.issueDescription}</li>
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
    console.error('Error creating repair request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabedaten', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Anfrage' },
      { status: 500 }
    )
  }
}
