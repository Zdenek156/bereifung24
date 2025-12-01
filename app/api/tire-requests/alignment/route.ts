import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const alignmentRequestSchema = z.object({
  vehicleId: z.string().optional(),
  vehicleMake: z.string().min(2, 'Bitte Fahrzeughersteller angeben'),
  vehicleModel: z.string().min(2, 'Bitte Fahrzeugmodell angeben'),
  vehicleYear: z.string().optional(),
  axleType: z.enum(['front', 'rear', 'both']),
  serviceLevel: z.enum(['measurement-only', 'with-adjustment', 'with-adjustment-inspection']),
  hasIssues: z.boolean().default(false),
  issueDescription: z.string().optional(),
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
    console.log('Alignment request body:', JSON.stringify(body, null, 2))
    const validatedData = alignmentRequestSchema.parse(body)

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

    const axleTypeMap = {
      front: 'Vorderachse',
      rear: 'Hinterachse',
      both: 'Beide Achsen'
    }

    const serviceLevelMap = {
      'measurement-only': 'Nur Achsvermessung',
      'with-adjustment': 'Achsvermessung mit Spureinstellung',
      'with-adjustment-inspection': 'Achsvermessung mit Spureinstellung und Fahrwerk-/Achsteile Prüfung'
    }

    // Create tire request with dummy specs for alignment service
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
          '📐 ACHSVERMESSUNG / SPUREINSTELLUNG',
          `Fahrzeug: ${validatedData.vehicleMake} ${validatedData.vehicleModel}${validatedData.vehicleYear ? ` (${validatedData.vehicleYear})` : ''}`,
          `Achse(n): ${axleTypeMap[validatedData.axleType]}`,
          `Leistung: ${serviceLevelMap[validatedData.serviceLevel]}`,
          '',
          validatedData.hasIssues && validatedData.issueDescription ? `⚠️ Probleme: ${validatedData.issueDescription}` : '✓ Keine bekannten Probleme',
          validatedData.additionalNotes ? `Anmerkungen: ${validatedData.additionalNotes}` : '',
        ].filter(Boolean).join('\n'),
        zipCode: customer.user.zipCode || '00000',
        city: city || customer.user.city || '',
        radiusKm: validatedData.radiusKm,
        needByDate: new Date(validatedData.needByDate),
        latitude,
        longitude,
        status: 'PENDING',
      },
    })

    // Get nearby workshops that offer alignment service with matching packages
    // Map service level to package types
    const packageTypeMap = {
      'measurement-only': 'measurement_only',
      'with-adjustment': 'with_adjustment',
      'with-adjustment-inspection': 'with_adjustment_inspection'
    }
    const requiredPackageType = packageTypeMap[validatedData.serviceLevel as keyof typeof packageTypeMap]

    // All alignment requests use ALIGNMENT_BOTH service type
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'ALIGNMENT_BOTH',
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
        },
        workshopServices: {
          where: {
            serviceType: 'ALIGNMENT_BOTH'
          },
        }
      },
      take: 20
    })

    // TODO: Filter by servicePackages once all workshops have packages configured
    // For now, send to all workshops offering ALIGNMENT_BOTH

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
            subject: '📐 Neue Achsvermessungs-Anfrage',
            html: `
              <h2>Neue Achsvermessungs-Anfrage</h2>
              <p>Hallo ${workshop.companyName},</p>
              <p>Es gibt eine neue Achsvermessungs-Anfrage in Ihrer Nähe.</p>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>Fahrzeug:</strong> ${validatedData.vehicleMake} ${validatedData.vehicleModel}${validatedData.vehicleYear ? ` (${validatedData.vehicleYear})` : ''}</li>
                <li><strong>Achse(n):</strong> ${axleTypeMap[validatedData.axleType]}</li>
                <li><strong>Leistung:</strong> ${serviceLevelMap[validatedData.serviceLevel]}</li>
                ${validatedData.hasIssues && validatedData.issueDescription ? `<li><strong>Probleme:</strong> ${validatedData.issueDescription}</li>` : ''}
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
    console.error('Error creating alignment request:', error)
    
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
