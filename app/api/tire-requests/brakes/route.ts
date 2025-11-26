import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const brakeRequestSchema = z.object({
  vehicleId: z.string().optional(),
  frontAxle: z.enum(['none', 'pads', 'pads-discs']),
  rearAxle: z.enum(['none', 'pads', 'pads-discs', 'pads-discs-handbrake']),
  vin: z.string().min(17).max(17),
  preferredBrands: z.string().optional(),
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
    const validatedData = brakeRequestSchema.parse(body)

    // Validate that at least one axle is selected
    if (validatedData.frontAxle === 'none' && validatedData.rearAxle === 'none') {
      return NextResponse.json(
        { error: 'Bitte wählen Sie mindestens eine Achse aus' },
        { status: 400 }
      )
    }

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

    // Map axle selections to German descriptions
    const axleLabels = {
      none: 'Keine Arbeiten',
      pads: 'Nur Bremsbeläge',
      'pads-discs': 'Bremsbeläge + Bremsscheiben',
      'pads-discs-handbrake': 'Bremsbeläge + Bremsscheiben + Handbremse'
    }

    // Create tire request for brake service
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
          'BREMSEN-SERVICE',
          `Vorderachse: ${axleLabels[validatedData.frontAxle]}`,
          `Hinterachse: ${axleLabels[validatedData.rearAxle]}`,
          `FIN: ${validatedData.vin}`,
          validatedData.preferredBrands ? `Bevorzugte Marken: ${validatedData.preferredBrands}` : '',
          validatedData.hasIssues && validatedData.issueDescription ? `⚠️ AKUTE PROBLEME: ${validatedData.issueDescription}` : '',
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

    // Determine required package types based on selected axles
    const requiredPackages: string[] = []
    if (validatedData.frontAxle === 'pads') requiredPackages.push('front_pads')
    if (validatedData.frontAxle === 'pads-discs') requiredPackages.push('front_pads_discs')
    if (validatedData.rearAxle === 'pads') requiredPackages.push('rear_pads')
    if (validatedData.rearAxle === 'pads-discs') requiredPackages.push('rear_pads_discs')
    if (validatedData.rearAxle === 'pads-discs-handbrake') requiredPackages.push('rear_pads_discs_handbrake')

    // Get nearby workshops that offer brake service with ALL required packages
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'BRAKE_SERVICE',
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
            serviceType: 'BRAKE_SERVICE'
          },
          include: {
            servicePackages: {
              where: {
                packageType: {
                  in: requiredPackages
                },
                isActive: true
              }
            }
          }
        }
      },
      take: 20
    })

    // Filter workshops that have ALL required packages
    const qualifiedWorkshops = workshops.filter(workshop => {
      const availablePackages = workshop.workshopServices[0]?.servicePackages.map(p => p.packageType) || []
      return requiredPackages.every(required => availablePackages.includes(required))
    })

    // Send notification emails to workshops
    for (const workshop of qualifiedWorkshops) {
      try {
        await sendEmail({
          to: workshop.user.email,
          subject: `Neue Anfrage: Bremsen-Service - ${vehicleInfo}`,
          html: `
            <h2>Neue Anfrage für Bremsen-Service</h2>
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
            <p><strong>Fahrgestellnummer (FIN):</strong> ${validatedData.vin}</p>
            
            <h3>Service-Details:</h3>
            <p>
              <strong>Vorderachse:</strong> ${axleLabels[validatedData.frontAxle]}<br>
              <strong>Hinterachse:</strong> ${axleLabels[validatedData.rearAxle]}<br>
              <strong>Benötigt bis:</strong> ${new Date(validatedData.needByDate).toLocaleDateString('de-DE')}<br>
              <strong>Suchradius:</strong> ${validatedData.radiusKm} km
            </p>
            
            ${validatedData.preferredBrands ? `
              <h3>Bevorzugte Marken:</h3>
              <p>${validatedData.preferredBrands}</p>
            ` : ''}
            
            ${validatedData.hasIssues && validatedData.issueDescription ? `
              <h3>⚠️ AKUTE PROBLEME - DRINGEND:</h3>
              <p style="background-color: #fee; padding: 10px; border-left: 4px solid #f00;">
                ${validatedData.issueDescription}
              </p>
              <p style="color: #f00;"><strong>Hinweis:</strong> Der Kunde hat akute Probleme gemeldet. Bitte zeitnah kontaktieren!</p>
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
      notifiedWorkshops: qualifiedWorkshops.length
    })

  } catch (error) {
    console.error('Error creating brake service request:', error)
    
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
