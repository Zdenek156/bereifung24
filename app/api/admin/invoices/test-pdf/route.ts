import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoicePdf } from '@/lib/invoicing/invoicePdfService'
import { sendInvoiceEmail } from '@/lib/invoicing/invoiceEmailService'

/**
 * TEST 2: Generate PDF for latest invoice
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST 2: Generate PDF for latest invoice')

    // Get latest invoice
    const invoice = await prisma.commissionInvoice.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: {
          include: {
            user: {
              select: { email: true, phone: true }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'No invoice found. Run Test 1 first.'
      }, { status: 404 })
    }

    console.log(`📄 Generating PDF for invoice: ${invoice.invoiceNumber}`)

    // Generate PDF
    const pdfUrl = await generateInvoicePdf(invoice.id)

    console.log(`✅ PDF generated: ${pdfUrl}`)

    // Update invoice with PDF URL
    await prisma.commissionInvoice.update({
      where: { id: invoice.id },
      data: { 
        pdfUrl,
        sentAt: new Date()
      }
    })

    // Send email with PDF attachment
    console.log(`📧 Sending invoice email to ${invoice.workshop.user?.email}`)
    const emailResult = await sendInvoiceEmail(invoice.id)
    
    if (emailResult.success) {
      console.log(`✅ Email sent successfully`)
    } else {
      console.error(`⚠️ Email failed: ${emailResult.error}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl,
        workshop: invoice.workshop.companyName,
        emailSent: emailResult.success,
        emailError: emailResult.error
      }
    })

  } catch (error) {
    console.error('❌ PDF test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
