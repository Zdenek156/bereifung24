import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * POST /api/workshop/bookings/[id]/upload-invoice
 * Upload invoice PDF for a booking
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

    if (session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Find workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Find booking and verify ownership
    const booking = await prisma.directBooking.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
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

    if (booking.workshopId !== workshop.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Buchung' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('invoice') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Nur PDF-Dateien sind erlaubt' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei ist zu groß (max. 5MB)' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'invoices')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `invoice-${params.id}-${timestamp}.pdf`
    const filepath = path.join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate public URL
    const invoiceUrl = `/uploads/invoices/${filename}`

    // Update booking with invoice URL
    await prisma.directBooking.update({
      where: { id: params.id },
      data: {
        invoiceUrl,
        invoiceUploadedAt: new Date()
      }
    })

    // If customer requested invoice, send notification email
    if (booking.invoiceRequestedAt) {
      // TODO: Send email to customer that invoice is now available
      console.log(`[INVOICE] Customer ${booking.customer.user.email} requested invoice, now available`)
    }

    return NextResponse.json({ 
      success: true,
      invoiceUrl,
      message: 'Rechnung erfolgreich hochgeladen'
    })

  } catch (error) {
    console.error('Error uploading invoice:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Rechnung' },
      { status: 500 }
    )
  }
}
