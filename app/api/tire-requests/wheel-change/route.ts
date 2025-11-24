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
              Telefon: ${customer.user.phone || 'Nicht angegeben'}<br>
              E-Mail: ${customer.user.email}
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

    console.log(`✅ Sent notifications to ${workshops.length} workshops offering WHEEL_CHANGE service`)

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: customer.user.email,
        subject: 'Ihre Anfrage für Räder umstecken wurde erstellt',
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
                <p>Vielen Dank für Ihre Anfrage für Räder umstecken!</p>
                
                <div class="highlight">
                  <strong>📢 Ihre Anfrage wurde an ${workshops.length} Werkstatt${workshops.length !== 1 ? 'en' : ''} in Ihrer Nähe weitergeleitet!</strong><br>
                  Sie werden in Kürze Angebote erhalten.
                </div>
                
                <h3>Ihre Anfrage:</h3>
                <p>
                  <strong>Service:</strong> Räder umstecken (Sommer/Winter)<br>
                  ${vehicleInfo !== 'Nicht angegeben' ? `<strong>Fahrzeug:</strong> ${vehicleInfo}<br>` : ''}
                  ${validatedData.preferredDate ? `<strong>Wunschtermin:</strong> ${new Date(validatedData.preferredDate).toLocaleDateString('de-DE')}<br>` : ''}
                </p>
                
                <h3>Details:</h3>
                <ul>
                  <li>Komplett montierte Räder: ${validatedData.hasWheels ? 'Ja' : 'Nein'}</li>
                  <li>Wuchten gewünscht: ${validatedData.needsBalancing ? 'Ja' : 'Nein'}</li>
                  <li>Einlagerung gewünscht: ${validatedData.needsStorage ? 'Ja' : 'Nein'}</li>
                </ul>
                
                <p style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/customer" class="button">
                    Zum Dashboard
                  </a>
                </p>
              </div>
            </div>
          </body>
          </html>
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
