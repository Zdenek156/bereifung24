import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const wheelChangeRequestSchema = z.object({
  vehicleId: z.string().optional(),
  hasWheels: z.boolean().default(true),
  needsBalancing: z.boolean().default(false),
  needsStorage: z.boolean().default(false),
  preferredDate: z.string().optional(),
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
    const validatedData = wheelChangeRequestSchema.parse(body)

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

    // Create a tire request with minimal data for wheel change service
    // We'll use dummy tire specs since it's just wheel swapping
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        vehicleId: validatedData.vehicleId || null,
        season: 'SUMMER', // Dummy value - wheel change is season-independent
        width: 0, // Dummy value
        aspectRatio: 0, // Dummy value
        diameter: 0, // Dummy value
        quantity: 4,
        additionalNotes: [
          'RÄDER UMSTECKEN (SOMMER/WINTER)',
          validatedData.hasWheels ? '✓ Komplett montierte Räder vorhanden' : '✗ Keine montierten Räder',
          validatedData.needsBalancing ? '✓ Wuchten gewünscht' : '✗ Wuchten nicht gewünscht',
          validatedData.needsStorage ? '✓ Einlagerung gewünscht' : '✗ Einlagerung nicht gewünscht',
          validatedData.preferredDate ? `Wunschtermin: ${validatedData.preferredDate}` : '',
          validatedData.additionalNotes ? `Anmerkungen: ${validatedData.additionalNotes}` : '',
        ].filter(Boolean).join('\n'),
        zipCode: customer.user.zipCode || '00000',
        city: customer.user.city || '',
        radiusKm: 25,
        needByDate: validatedData.preferredDate 
          ? new Date(validatedData.preferredDate)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'PENDING',
      }
    })

    // Get nearby workshops that offer WHEEL_CHANGE service
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'WHEEL_CHANGE',
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
            serviceType: 'WHEEL_CHANGE'
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
          subject: `Neue Anfrage: Räder umstecken - ${vehicleInfo}`,
          html: `
            <h2>Neue Anfrage für Räder umstecken</h2>
            <p>Eine neue Anfrage wurde erstellt:</p>
            
            <h3>Kunde:</h3>
            <p>
              ${customer.user.firstName} ${customer.user.lastName}<br>
              ${customer.user.street || ''}<br>
              ${customer.user.zipCode || ''} ${customer.user.city || ''}<br>
              ${customer.user.phone || ''}
            </p>
            
            <h3>Fahrzeug:</h3>
            <p>${vehicleInfo}</p>
            
            <h3>Details:</h3>
            <ul>
              <li>Komplett montierte Räder: ${validatedData.hasWheels ? 'Ja' : 'Nein'}</li>
              <li>Wuchten gewünscht: ${validatedData.needsBalancing ? 'Ja' : 'Nein'}</li>
              <li>Einlagerung gewünscht: ${validatedData.needsStorage ? 'Ja' : 'Nein'}</li>
              ${validatedData.preferredDate ? `<li>Wunschtermin: ${new Date(validatedData.preferredDate).toLocaleDateString('de-DE')}</li>` : ''}
            </ul>
            
            ${validatedData.additionalNotes ? `
              <h3>Zusätzliche Anmerkungen:</h3>
              <p>${validatedData.additionalNotes}</p>
            ` : ''}
            
            <p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop" 
                 style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                Anfrage im Dashboard ansehen
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
      await sendEmail({
        to: customer.user.email,
        subject: 'Ihre Anfrage für Räder umstecken wurde erstellt',
        html: `
          <h2>Anfrage erfolgreich erstellt</h2>
          <p>Vielen Dank für Ihre Anfrage!</p>
          
          <h3>Ihre Anfrage:</h3>
          <p>
            Service: Räder umstecken (Sommer/Winter)<br>
            ${vehicleInfo !== 'Nicht angegeben' ? `Fahrzeug: ${vehicleInfo}<br>` : ''}
            ${validatedData.preferredDate ? `Wunschtermin: ${new Date(validatedData.preferredDate).toLocaleDateString('de-DE')}<br>` : ''}
          </p>
          
          <h3>Details:</h3>
          <ul>
            <li>Komplett montierte Räder: ${validatedData.hasWheels ? 'Ja' : 'Nein'}</li>
            <li>Wuchten gewünscht: ${validatedData.needsBalancing ? 'Ja' : 'Nein'}</li>
            <li>Einlagerung gewünscht: ${validatedData.needsStorage ? 'Ja' : 'Nein'}</li>
          </ul>
          
          <p>Wir haben Ihre Anfrage an Werkstätten in Ihrer Nähe weitergeleitet. Sie werden in Kürze Angebote erhalten.</p>
          
          <p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/customer" 
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
              Zum Dashboard
            </a>
          </p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email to customer:', emailError)
    }

    return NextResponse.json({
      success: true,
      requestId: tireRequest.id,
      message: 'Ihre Anfrage wurde erfolgreich erstellt und an Werkstätten weitergeleitet.'
    })

  } catch (error: any) {
    console.error('POST /api/tire-requests/wheel-change error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
