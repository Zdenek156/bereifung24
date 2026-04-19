import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { getInvoiceFilePath } from '@/lib/invoicing/invoicePdfService'
import { generateInvoicePdf } from '@/lib/invoicing/invoicePdfService'
import fs from 'fs'

/**
 * GET /api/admin/invoices/[id]/pdf
 * Serve invoice PDF from persistent data directory
 * Auto-regenerates if file is missing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: params.id },
      select: { id: true, invoiceNumber: true, pdfUrl: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    let pdfUrl = invoice.pdfUrl

    // If no pdfUrl or file missing, regenerate
    if (!pdfUrl || !fs.existsSync(getInvoiceFilePath(pdfUrl))) {
      console.log(`⚠️ Invoice PDF missing for ${invoice.invoiceNumber}, regenerating...`)
      try {
        pdfUrl = await generateInvoicePdf(invoice.id)
      } catch (genError) {
        console.error(`❌ Failed to regenerate PDF for ${invoice.invoiceNumber}:`, genError)
        return NextResponse.json({ error: 'PDF nicht verfügbar und konnte nicht regeneriert werden' }, { status: 404 })
      }
    }

    const filePath = getInvoiceFilePath(pdfUrl)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'PDF-Datei nicht gefunden' }, { status: 404 })
    }

    const pdfBuffer = fs.readFileSync(filePath)
    const filename = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving invoice PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
