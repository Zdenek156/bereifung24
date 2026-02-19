import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/customer/direct-booking/[id]/request-invoice
 * Customer requests invoice from workshop
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Find booking with workshop and customer details
    const booking = await prisma.directBooking.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                email: true,
                firstName: true
              }
            }
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (booking.customer.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Check if invoice already exists
    if (booking.invoiceUrl) {
      return NextResponse.json(
        { error: 'Rechnung bereits vorhanden' },
        { status: 400 }
      )
    }

    // Update booking to mark invoice as requested
    await prisma.directBooking.update({
      where: { id: params.id },
      data: {
        invoiceRequestedAt: new Date()
      }
    })

    // Send email to workshop
    const bookingNumber = `DB-${booking.id.slice(-8).toUpperCase()}`
    const uploadUrl = `https://bereifung24.de/dashboard/workshop/bookings?highlight=${booking.id}`
    
    const emailSubject = `Rechnungsanforderung für Buchung ${bookingNumber}`
    const emailBody = `
      <h2>Rechnungsanforderung</h2>
      <p>Sehr geehrte/r ${booking.workshop.user.firstName || 'Werkstatt'},</p>
      
      <p>Der Kunde <strong>${booking.customer.user.firstName} ${booking.customer.user.lastName}</strong> 
      hat eine Rechnung für folgende Buchung angefordert:</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Buchungsnummer:</strong> ${bookingNumber}</p>
        <p><strong>Fahrzeug:</strong> ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate || 'Kein Kennzeichen'})</p>
        <p><strong>Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        })}</p>
        <p><strong>Uhrzeit:</strong> ${booking.time} Uhr</p>
        <p><strong>Gesamtpreis:</strong> ${Number(booking.totalPrice).toFixed(2)} €</p>
      </div>
      
      <p><strong>Bitte laden Sie die Rechnung hoch:</strong></p>
      <p><a href="${uploadUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Rechnung hochladen</a></p>
      
      <p>Alternativ können Sie die Rechnung auch im Werkstatt-Portal unter <strong>Buchungen</strong> hochladen.</p>
      
      <p>Mit freundlichen Grüßen<br>
      Ihr Bereifung24-Team</p>
    `

    try {
      await sendEmail({
        to: booking.workshop.user.email,
        subject: emailSubject,
        html: emailBody
      })
    } catch (emailError) {
      console.error('Failed to send invoice request email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Die Werkstatt wurde über Ihre Anfrage informiert und wird die Rechnung in Kürze bereitstellen.'
    })

  } catch (error) {
    console.error('Error requesting invoice:', error)
    return NextResponse.json(
      { error: 'Fehler beim Anfordern der Rechnung' },
      { status: 500 }
    )
  }
}
