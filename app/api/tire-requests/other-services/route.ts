import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const otherServicesRequestSchema = z.object({
  vehicleId: z.string().optional(),
  services: z.array(z.string()).min(1, 'Bitte mindestens einen Service auswählen'),
  otherServiceDescription: z.string().optional(),
  serviceDescription: z.string().min(10, 'Bitte beschreiben Sie Ihre Anfrage genauer'),
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
    console.log('Other services request body:', JSON.stringify(body, null, 2))
    const validatedData = otherServicesRequestSchema.parse(body)

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

    const serviceMap: { [key: string]: string } = {
      'tpms': 'RDKS-Sensoren (Reifendruckkontrolle)',
      'valve': 'Ventilwechsel',
      'runflat': 'Runflat-Reifenmontage',
      'other': validatedData.otherServiceDescription || 'Sonstiger Service'
    }

    const selectedServices = validatedData.services.map(s => serviceMap[s] || s)

    // Create tire request with dummy specs for other services
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: validatedData.vehicleId || null,
        season: 'SUMMER', // Dummy value
        width: 0, // Dummy - indicates service request
        aspectRatio: 0,
        diameter: 0,
        quantity: 1,
        additionalNotes: [
          '🔧 SONSTIGE REIFENSERVICES',
          '',
          'Gewünschte Services:',
          ...selectedServices.map(s => `✓ ${s}`),
          '',
          `Beschreibung: ${validatedData.serviceDescription}`,
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
            cos(radians(${latitude})) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(u.latitude))
          )
        ) AS distance
      FROM workshops w
      INNER JOIN users u ON w."userId" = u.id
      WHERE u.active = true
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      HAVING distance <= ${validatedData.radiusKm}
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
            subject: '🔧 Neue Service-Anfrage in Ihrer Nähe',
            html: `
              <h2>Neue Reifenservice-Anfrage</h2>
              <p>Hallo ${workshopWithUser.companyName},</p>
              <p>Es gibt eine neue Service-Anfrage in Ihrer Nähe (${workshop.distance.toFixed(1)} km).</p>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>Services:</strong> ${selectedServices.join(', ')}</li>
                <li><strong>Beschreibung:</strong> ${validatedData.serviceDescription}</li>
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
    console.error('Error creating other services request:', error)
    
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
