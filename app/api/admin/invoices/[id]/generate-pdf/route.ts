import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'
import { generateInvoicePdf } from '@/lib/invoicing/invoicePdfService'

/**
 * POST /api/admin/invoices/[id]/generate-pdf
 * Generate PDF for specific invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID required' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfUrl = await generateInvoicePdf(id)

    return NextResponse.json({
      success: true,
      data: { pdfUrl }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
