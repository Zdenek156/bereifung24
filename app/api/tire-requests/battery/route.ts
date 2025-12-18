import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { geocodeAddress } from '@/lib/geocoding'

const batteryRequestSchema = z.object({
  vehicleId: z.string().optional(),
  identificationMethod: z.enum(['manual', 'vin', 'key']),
  vin: z.string().optional(),
  keyNumber: z.string().optional(),
  currentBatteryAh: z.string().optional(),
  currentBatteryCCA: z.string().optional(),
  currentBatteryType: z.enum(['lead-acid', 'efb', 'agm', 'lithium', '']).optional(),
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
    const validatedData = batteryRequestSchema.parse(body)

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

    // Map battery type to German description
    const batteryTypeLabels = {
      'lead-acid': 'Standard Bleisäure',
      'efb': 'EFB (Enhanced Flooded Battery)',
      'agm': 'AGM (Absorbent Glass Mat)',
      'lithium': 'Lithium-Ionen',
      '': 'Nicht angegeben'
    }

    // Build identification info
    let identificationInfo = ''
    if (validatedData.identificationMethod === 'vin' && validatedData.vin) {
      identificationInfo = `FIN: ${validatedData.vin}`
    } else if (validatedData.identificationMethod === 'key' && validatedData.keyNumber) {
      identificationInfo = `Schlüsselnummer: ${validatedData.keyNumber}`
    } else {
      const specs = []
      if (validatedData.currentBatteryAh) specs.push(`${validatedData.currentBatteryAh} Ah`)
      if (validatedData.currentBatteryCCA) specs.push(`${validatedData.currentBatteryCCA} CCA`)
      if (validatedData.currentBatteryType) specs.push(batteryTypeLabels[validatedData.currentBatteryType])
      identificationInfo = specs.length > 0 ? specs.join(', ') : 'Keine Angaben'
    }

    // Create tire request for battery service
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
          'BATTERIE-SERVICE',
          `Identifikation: ${identificationInfo}`,
          validatedData.preferredBrands ? `Bevorzugte Marken: ${validatedData.preferredBrands}` : '',
          validatedData.hasIssues && validatedData.issueDescription ? `Problem: ${validatedData.issueDescription}` : '',
          '⚠️ WICHTIG: Batterieregistrierung erforderlich bei modernen Fahrzeugen',
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

    // Get nearby workshops that offer battery service
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'BATTERY_SERVICE',
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
      // Prüfe ob Werkstatt Benachrichtigungen aktiviert hat
      if (!workshop.emailNotifyRequests) {
        console.log(`⏭️  Workshop ${workshop.id} has disabled new request notifications`)
        continue
      }

      try {
        await sendEmail({
          to: workshop.user.email,
          subject: `Neue Anfrage: Batterie-Service - ${vehicleInfo}`,
          html: `
            <h2>Neue Anfrage für Batterie-Service</h2>
            <p>Hallo ${workshop.companyName},</p>
            <p>Es gibt eine neue Batterie-Service-Anfrage in Ihrer Nähe.</p>
            
            <h3>Fahrzeug:</h3>
            <p>${vehicleInfo}</p>
            
            <h3>Batterie-Identifikation:</h3>
            <p>${identificationInfo}</p>
            ${validatedData.identificationMethod === 'manual' && validatedData.currentBatteryType ? `
              <p><strong>Batterietyp:</strong> ${batteryTypeLabels[validatedData.currentBatteryType]}</p>
            ` : ''}
            
            <h3>Service-Details:</h3>
            <p>
              <strong>Benötigt bis:</strong> ${new Date(validatedData.needByDate).toLocaleDateString('de-DE')}<br>
              <strong>Suchradius:</strong> ${validatedData.radiusKm} km
            </p>
            
            ${validatedData.preferredBrands ? `
              <h3>Bevorzugte Marken:</h3>
              <p>${validatedData.preferredBrands}</p>
            ` : ''}
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">⚠️ WICHTIG - Batterieregistrierung:</p>
              <p style="margin: 10px 0 0 0;">
                Bei Fahrzeugen ab ca. 2010 muss die neue Batterie elektronisch registriert und angelernt werden, 
                damit das Lademanagement korrekt funktioniert. Bei Start-Stopp-Systemen ist dies zwingend erforderlich!
              </p>
            </div>
            
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

    // Send confirmation email to customer
    try {
      const batteryTypeLabels = {
        'lead-acid': 'Standard Bleisäure',
        'efb': 'EFB (Enhanced Flooded Battery)',
        'agm': 'AGM (Absorbent Glass Mat)',
        'lithium': 'Lithium-Ionen',
        '': 'Nicht angegeben'
      }

      await sendEmail({
        to: customer.user.email,
        subject: 'Ihre Anfrage für Batterie-Service wurde erstellt',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; }
              .highlight { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Anfrage erfolgreich erstellt</h1>
              </div>
              <div class="content">
                <p><strong>Hallo ${customer.user.firstName},</strong></p>
                <p>Vielen Dank für Ihre Batterie-Service Anfrage! Wir haben Werkstätten in Ihrer Nähe informiert.</p>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">📋 Ihre Anfrage im Überblick:</h3>
                  <ul style="list-style: none; padding-left: 0;">
                    <li><strong>Service:</strong> Batterie-Wechsel</li>
                    ${vehicleInfo !== 'Nicht angegeben' ? `<li><strong>Fahrzeug:</strong> ${vehicleInfo}</li>` : ''}
                    ${validatedData.currentBatteryType ? `<li><strong>Aktueller Batterietyp:</strong> ${batteryTypeLabels[validatedData.currentBatteryType]}</li>` : ''}
                    ${validatedData.currentBatteryAh ? `<li><strong>Kapazität:</strong> ${validatedData.currentBatteryAh} Ah</li>` : ''}
                    ${validatedData.currentBatteryCCA ? `<li><strong>Kaltstartstrom:</strong> ${validatedData.currentBatteryCCA} CCA</li>` : ''}
                    ${validatedData.preferredBrands ? `<li><strong>Bevorzugte Marken:</strong> ${validatedData.preferredBrands}</li>` : ''}
                    <li><strong>Benötigt bis:</strong> ${new Date(validatedData.needByDate).toLocaleDateString('de-DE')}</li>
                  </ul>
                </div>

                <h3>⏱️ Wie geht es weiter?</h3>
                <p>Werkstätten in Ihrer Nähe wurden über Ihre Anfrage informiert und können Ihnen nun Angebote erstellen. Sie erhalten eine E-Mail, sobald ein Angebot eingeht.</p>

                <p style="text-align: center; margin: 30px 0;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/requests" style="height:50px;v-text-anchor:middle;width:250px;" arcsize="16%" strokecolor="#667eea" fillcolor="#667eea">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Meine Anfragen ansehen</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/requests" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: Arial, sans-serif;">
                    Meine Anfragen ansehen
                  </a>
                  <!--<![endif]-->
                </p>

                <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p>Mit freundlichen Grüßen,<br><strong>Ihr Bereifung24 Team</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
      })
      console.log(`✅ Confirmation email sent to customer ${customer.user.email}`)
    } catch (emailError) {
      console.error('Failed to send confirmation email to customer:', emailError)
    }

    return NextResponse.json({
      success: true,
      requestId: tireRequest.id,
      notifiedWorkshops: workshops.length
    })

  } catch (error) {
    console.error('Error creating battery service request:', error)
    
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
