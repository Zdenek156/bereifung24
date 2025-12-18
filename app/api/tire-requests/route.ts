import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/geocoding'
import { sendEmail, newTireRequestEmailTemplate } from '@/lib/email'

const tireRequestSchema = z.object({
  season: z.enum(['SUMMER', 'WINTER', 'ALL_SEASON']),
  width: z.number().min(135).max(325),
  aspectRatio: z.number().min(25).max(90), // Extended for motorcycles
  diameter: z.number().min(13).max(24),
  loadIndex: z.number().min(50).max(150).optional(),
  speedRating: z.string().optional(),
  isRunflat: z.boolean().default(false),
  quantity: z.number().int().min(2).max(4).refine((val) => val === 2 || val === 4, {
    message: "Quantity must be either 2 or 4 tires"
  }),
  preferredBrands: z.string().optional(),
  additionalNotes: z.string().optional(),
  needByDate: z.string(),
  zipCode: z.string().length(5),
  radiusKm: z.number().min(5).max(100).default(25),
  vehicleId: z.string().optional(),
})

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = tireRequestSchema.parse(body)

    // Check if needByDate is at least 7 days in the future
    const needByDate = new Date(validatedData.needByDate)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 7)

    if (needByDate < minDate) {
      return NextResponse.json(
        { error: 'Das Benötigt-bis Datum muss mindestens 7 Tage in der Zukunft liegen' },
        { status: 400 }
      )
    }

    // Get customer's address for geocoding
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
    let vehicleInfo: string | undefined
    if (validatedData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: validatedData.vehicleId },
      })
      if (vehicle) {
        // Format vehicle info without license plate
        vehicleInfo = `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      }
    }

    // Use city from customer profile
    let latitude: number | null = null
    let longitude: number | null = null
    const city: string | null = customer.user.city || null
    console.log(`🏙️ Customer city from profile: "${city}" (user email: ${customer.user.email})`)

    // Geocode to get coordinates for workshop matching (but keep profile city)
    if (customer.user.street && customer.user.city) {
      const geocodeResult = await geocodeAddress(
        customer.user.street,
        validatedData.zipCode,
        customer.user.city
      )
      
      if (geocodeResult) {
        latitude = geocodeResult.latitude
        longitude = geocodeResult.longitude
      }
    }
    
    // If geocoding failed, try with just zipCode to get coordinates
    if (!latitude) {
      try {
        const zipCodeGeocodeResult = await geocodeAddress(
          '',
          validatedData.zipCode,
          'Germany'
        )
        if (zipCodeGeocodeResult?.latitude) {
          latitude = zipCodeGeocodeResult.latitude
          longitude = zipCodeGeocodeResult.longitude
        }
      } catch (error) {
        console.warn(`Failed to geocode zipCode ${validatedData.zipCode}:`, error)
      }
    }

    // Create tire request
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: validatedData.vehicleId,
        season: validatedData.season,
        width: validatedData.width,
        aspectRatio: validatedData.aspectRatio,
        diameter: validatedData.diameter,
        loadIndex: validatedData.loadIndex,
        speedRating: validatedData.speedRating,
        isRunflat: validatedData.isRunflat,
        quantity: validatedData.quantity,
        preferredBrands: validatedData.preferredBrands,
        additionalNotes: validatedData.additionalNotes,
        needByDate: needByDate,
        zipCode: validatedData.zipCode,
        city: city,
        radiusKm: validatedData.radiusKm,
        latitude: latitude,
        longitude: longitude,
        status: 'PENDING',
      },
    })

    // Find workshops within radius and send notification emails
    if (latitude && longitude) {
      try {
        // Get all verified workshops with coordinates that offer TIRE_CHANGE service
        // @ts-ignore - Prisma types need regeneration
        const workshops = await prisma.workshop.findMany({
          where: {
            isVerified: true,
            workshopServices: {
              some: {
                serviceType: 'TIRE_CHANGE',
                isActive: true
              }
            }
          },
          include: {
            user: true,
          },
        })

        // Calculate distance and filter workshops within radius
        // @ts-ignore - Prisma types need regeneration
        const workshopsInRange = workshops.filter(workshop => {
          // @ts-ignore - Prisma types need regeneration
          if (!workshop.user?.latitude || !workshop.user?.longitude) return false
          
          // @ts-ignore - Prisma types need regeneration
          const distance = calculateDistance(
            latitude,
            longitude,
            workshop.user.latitude,
            workshop.user.longitude
          )
          
          return distance <= validatedData.radiusKm
        })

        console.log(`📍 Found ${workshopsInRange.length} workshops within ${validatedData.radiusKm}km radius`)

        // Send email to each workshop in range
        // @ts-ignore - Prisma types need regeneration
        const emailPromises = workshopsInRange.map(async (workshop) => {
          // @ts-ignore - Prisma types need regeneration
          // Prüfe ob Werkstatt Benachrichtigungen für neue Anfragen aktiviert hat
          if (!workshop.emailNotifyRequests) {
            console.log(`⏭️  Workshop ${workshop.id} has disabled new request notifications`)
            return
          }

          // @ts-ignore - Prisma types need regeneration
          const distance = calculateDistance(
            latitude!,
            longitude!,
            workshop.user.latitude!,
            workshop.user.longitude!
          )

          // Build tire size with load/speed index or parse mixed tires
          let tireSize = ''
          let tireSizeDisplay = ''
          
          // Check if additionalNotes contains mixed tire dimensions
          const frontMatch = validatedData.additionalNotes?.match(/Vorderachse: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
          const rearMatch = validatedData.additionalNotes?.match(/Hinterachse: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
          
          if (frontMatch && rearMatch) {
            // Mixed tires
            tireSize = `${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]} / ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}`
            tireSizeDisplay = `Vorne: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] ? ' ' + frontMatch[4] : ''}${frontMatch[5] ? ' ' + frontMatch[5] : ''} • Hinten: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] ? ' ' + rearMatch[4] : ''}${rearMatch[5] ? ' ' + rearMatch[5] : ''}`
          } else {
            // Standard tires
            tireSize = `${validatedData.width}/${validatedData.aspectRatio} R${validatedData.diameter}`
            tireSizeDisplay = `${validatedData.width}/${validatedData.aspectRatio} R${validatedData.diameter}${validatedData.loadIndex ? ' ' + validatedData.loadIndex : ''}${validatedData.speedRating ? ' ' + validatedData.speedRating : ''}`
          }
          
          // Filter additional notes to remove structured data
          let filteredNotes = validatedData.additionalNotes || ''
          filteredNotes = filteredNotes
            .replace(/Vorderachse: \d+\/\d+ R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
            .replace(/Hinterachse: \d+\/\d+ R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
            .replace(/Vorderreifen: \d+\/\d+ R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
            .replace(/Hinterreifen: \d+\/\d+ R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
            .replace(/Altreifenentsorgung gewünscht\n?/g, '')
            .replace(/Motorradreifen \(Anfrage über Motorrad-Formular\)\n?/g, '')
            .replace(/Achsvermessung gewünscht\n?/g, '')
            .replace(/Räder auswuchten gewünscht\n?/g, '')
            .replace(/RDKS-Sensoren programmieren gewünscht\n?/g, '')
            .trim()
          
          const formattedDate = new Date(validatedData.needByDate).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })

          // Check if tire disposal is requested
          const hasTireDisposal = validatedData.additionalNotes?.includes('Altreifenentsorgung gewünscht') || false

          try {
            await sendEmail({
              to: workshop.user.email,
              subject: `Neue Reifenanfrage in Ihrer Nähe - ${tireSize}`,
              html: newTireRequestEmailTemplate({
                workshopName: workshop.user.lastName,
                requestId: tireRequest.id,
                season: validatedData.season,
                tireSize: tireSizeDisplay,
                quantity: validatedData.quantity,
                needByDate: formattedDate,
                distance: `${distance.toFixed(1)} km`,
                preferredBrands: validatedData.preferredBrands,
                additionalNotes: filteredNotes || undefined,
                vehicleInfo: vehicleInfo,
                isRunflat: validatedData.isRunflat,
                hasTireDisposal: hasTireDisposal,
              })
            })
            console.log(`📧 Notification email sent to workshop: ${workshop.user.email}`)
          } catch (emailError) {
            console.error(`Failed to send notification to workshop ${workshop.id}:`, emailError)
          }
        })

        await Promise.all(emailPromises)
        console.log(`✅ Sent notifications to ${workshopsInRange.length} workshops`)
      } catch (notificationError) {
        console.error('Error sending workshop notifications:', notificationError)
        // Don't fail the request creation if notifications fail
      }
    } else {
      console.warn('No coordinates available - skipping workshop notifications')
    }

    // Send confirmation email to customer
    try {
      const seasonLabels = {
        SUMMER: 'Sommerreifen',
        WINTER: 'Winterreifen',
        ALL_SEASON: 'Ganzjahresreifen'
      }

      await sendEmail({
        to: customer.user.email,
        subject: 'Ihre Reifenanfrage wurde erstellt',
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
                <p>Vielen Dank für Ihre Reifenanfrage! Wir haben Werkstätten in Ihrer Nähe informiert.</p>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">📋 Ihre Anfrage im Überblick:</h3>
                  <ul style="list-style: none; padding-left: 0;">
                    <li><strong>Reifentyp:</strong> ${seasonLabels[validatedData.season]}</li>
                    <li><strong>Größe:</strong> ${validatedData.width}/${validatedData.aspectRatio} R${validatedData.diameter}</li>
                    <li><strong>Anzahl:</strong> ${validatedData.quantity} Reifen</li>
                    ${validatedData.preferredBrands ? `<li><strong>Bevorzugte Marken:</strong> ${validatedData.preferredBrands}</li>` : ''}
                    ${vehicleInfo ? `<li><strong>Fahrzeug:</strong> ${vehicleInfo}</li>` : ''}
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
      message: 'Reifenanfrage erfolgreich erstellt',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating tire request:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tireRequests = await prisma.tireRequest.findMany({
      where: {
        customerId: session.user.customerId!,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
          },
        },
        _count: {
          select: {
            offers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests: tireRequests })
  } catch (error) {
    console.error('Error fetching tire requests:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
