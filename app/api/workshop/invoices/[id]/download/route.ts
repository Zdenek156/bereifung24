import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getInvoiceFilePath, generateInvoicePdf } from '@/lib/invoicing/invoicePdfService'
import fs from 'fs'

// GET /api/workshop/invoices/[id]/download - Download invoice PDF
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true }
    })

    if (!user?.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get invoice - verify it belongs to this workshop
    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: params.id }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Security: Verify workshop ownership
    if (invoice.workshopId !== user.workshop.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    if (!invoice.pdfUrl) {
      return NextResponse.json(
        { error: 'PDF nicht verfügbar' },
        { status: 404 }
      )
    }

    // Read PDF file from persistent data directory
    let pdfPath = getInvoiceFilePath(invoice.pdfUrl)

    if (!fs.existsSync(pdfPath)) {
      // Auto-regenerate if missing
      try {
        await generateInvoicePdf(invoice.id)
        pdfPath = getInvoiceFilePath(invoice.pdfUrl)
      } catch (e) {
        return NextResponse.json(
          { error: 'PDF-Datei nicht gefunden und konnte nicht regeneriert werden' },
          { status: 404 }
        )
      }
    }

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'PDF-Datei nicht gefunden' },
        { status: 404 }
      )
    }

    const pdfBuffer = fs.readFileSync(pdfPath)
    const filename = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('[WORKSHOP INVOICE DOWNLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Herunterladen der Rechnung' },
      { status: 500 }
    )
  }
}
