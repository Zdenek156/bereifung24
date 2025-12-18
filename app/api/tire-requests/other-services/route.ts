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
      'rdks': 'RDKS anlernen',
      'valves': 'Ventile tauschen',
      'wheel_wash': 'Räderwäsche',
      'tire_storage': 'Reifen einlagern',
      'balancing': 'Räder auswuchten',
      'tire_check': 'Reifenzustandsprüfung',
      'pressure_check': 'Reifendruck prüfen',
      'other': validatedData.otherServiceDescription || 'Sonstiges'
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
          `Beschreibung: ${validatedData.serviceDescription}`,
          validatedData.additionalNotes ? `Zusätzliche Hinweise: ${validatedData.additionalNotes}` : '',
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

    // Find nearby workshops
    // Get nearby workshops that offer other services
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'OTHER_SERVICES',
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
            subject: '🔧 Neue Service-Anfrage',
            html: `
              <h2>Neue Reifenservice-Anfrage</h2>
              <p>Hallo ${workshop.companyName},</p>
              <p>Es gibt eine neue Service-Anfrage in Ihrer Nähe.</p>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>Services:</strong> ${selectedServices.join(', ')}</li>
                <li><strong>Beschreibung:</strong> ${validatedData.serviceDescription}</li>
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

    console.log(`✅ Sent notifications to ${workshops.length} workshops offering OTHER_SERVICES`)

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: customer.user.email,
        subject: 'Ihre Anfrage für Sonstige Services wurde erstellt',
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
                <p>Vielen Dank für Ihre Anfrage! Wir haben Ihre Service-Anfrage erfolgreich an Werkstätten in Ihrer Nähe weitergeleitet.</p>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">📋 Ihre Anfrage im Überblick:</h3>
                  <p><strong>Gewählte Services:</strong><br>${selectedServices.join(', ')}</p>
                  <p><strong>Beschreibung:</strong><br>${validatedData.serviceDescription}</p>
                  <p><strong>Benötigt bis:</strong> ${new Date(validatedData.needByDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  <p><strong>Suchradius:</strong> ${validatedData.radiusKm} km</p>
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
      workshopsNotified: workshops.length,
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
