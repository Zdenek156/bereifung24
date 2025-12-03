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
  quantity: z.number().refine((val) => val === 2 || val === 4, {
    message: "Quantity must be either 2 or 4 tires"
  }).default(2),
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
        // Get all verified workshops with coordinates
        // @ts-ignore - Prisma types need regeneration
        const workshops = await prisma.workshop.findMany({
          where: {
            isVerified: true,
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
                customerCity: city || undefined,
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
