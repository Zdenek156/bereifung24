import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const climateRequestSchema = z.object({
  vehicleId: z.string().optional(),
  serviceType: z.enum(['check', 'basic', 'comfort', 'premium']),
  vin: z.string().optional(),
  hasIssues: z.boolean().default(false),
  issueDescription: z.string().optional(),
  needByDate: z.string(),
  radiusKm: z.number().min(5).max(100).default(25),
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
    const validatedData = climateRequestSchema.parse(body)

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

    // Get vehicle information if provided
    let vehicleInfo: string = 'Nicht angegeben'
    if (validatedData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: validatedData.vehicleId },
      })
      if (vehicle) {
        vehicleInfo = `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      }
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

    // Map service type to German description
    const serviceTypeLabels = {
      check: 'Klimaanlagen-Inspektion (nur Prüfung)',
      basic: 'Klimaservice Basic (Desinfektion + Nachfüllen)',
      comfort: 'Klimaservice Comfort (+ Leckerkennung)',
      premium: 'Klimaservice Premium (+ Innenraumdesinfektion)'
    }

    // Create tire request for climate service
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: validatedData.vehicleId || null,
        season: 'SUMMER', // Dummy value
        width: 0,
        aspectRatio: 0,
        diameter: 0,
        quantity: 1,
        additionalNotes: [
          `KLIMASERVICE: ${serviceTypeLabels[validatedData.serviceType]}`,
          validatedData.vin ? `FIN: ${validatedData.vin}` : '',
          validatedData.hasIssues && validatedData.issueDescription ? `Problem: ${validatedData.issueDescription}` : '',
          validatedData.additionalNotes || '',
        ].filter(Boolean).join('\n'),
        zipCode: customer.user.zipCode || '00000',
        city: city || customer.user.city || '',
        radiusKm: validatedData.radiusKm,
        latitude,
        longitude,
        needByDate: new Date(validatedData.needByDate),
        status: 'PENDING',
      }
    })

    // Get nearby workshops that offer climate service
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'CLIMATE_SERVICE',
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

    // Send notification emails to workshops
    for (const workshop of workshops) {
      try {
        await sendEmail({
          to: workshop.user.email,
          subject: `Neue Anfrage: Klimaservice - ${vehicleInfo}`,
          html: `
            <h2>Neue Anfrage für Klimaservice</h2>
            <p>Eine neue Anfrage wurde erstellt:</p>
            
            <h3>Kunde:</h3>
            <p>
              ${customer.user.firstName} ${customer.user.lastName}<br>
              ${customer.user.street || 'Keine Adresse'}<br>
              ${customer.user.zipCode || ''} ${customer.user.city || ''}<br>
              E-Mail: ${customer.user.email}<br>
              ${customer.user.phone ? `Telefon: ${customer.user.phone}` : 'Keine Telefonnummer'}
            </p>
            
            <h3>Fahrzeug:</h3>
            <p>${vehicleInfo}</p>
            ${validatedData.vin ? `<p><strong>Fahrgestellnummer:</strong> ${validatedData.vin}</p>` : ''}
            
            <h3>Service-Details:</h3>
            <p>
              <strong>Service-Typ:</strong> ${serviceTypeLabels[validatedData.serviceType]}<br>
              <strong>Benötigt bis:</strong> ${new Date(validatedData.needByDate).toLocaleDateString('de-DE')}<br>
              <strong>Suchradius:</strong> ${validatedData.radiusKm} km
            </p>
            
            ${validatedData.hasIssues && validatedData.issueDescription ? `
              <h3>Bestehende Probleme:</h3>
              <p style="background-color: #fee; padding: 10px; border-left: 4px solid #f00;">
                ${validatedData.issueDescription}
              </p>
            ` : ''}
            
            ${validatedData.additionalNotes ? `
              <h3>Zusätzliche Anmerkungen:</h3>
              <p>${validatedData.additionalNotes}</p>
            ` : ''}
            
            <p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop/requests" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Anfragen ansehen
              </a>
            </p>
          `
        })
      } catch (emailError) {
        console.error(`Failed to send email to workshop ${workshop.id}:`, emailError)
      }
    }

    return NextResponse.json({
      success: true,
      requestId: tireRequest.id,
      notifiedWorkshops: workshops.length
    })

  } catch (error) {
    console.error('Error creating climate service request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Anfrage' },
      { status: 500 }
    )
  }
}
