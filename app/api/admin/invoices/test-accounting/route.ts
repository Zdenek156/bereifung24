import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createInvoiceBooking } from '@/lib/invoicing/invoiceAccountingService'

/**
 * TEST 3: Create accounting entry for latest invoice
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST 3: Create accounting entry')

    // Get latest invoice with DirectBooking data
    const invoice = await prisma.commissionInvoice.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: true
      }
    })

    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'No invoice found. Run Test 1 first.'
      }, { status: 404 })
    }

    console.log(`📊 Creating accounting entry for: ${invoice.invoiceNumber}`)

    // Get DirectBooking IDs from the invoice period
    const directBookings = await prisma.directBooking.findMany({
      where: {
        workshopId: invoice.workshopId,
        paymentStatus: 'PAID',
        paidAt: {
          gte: invoice.periodStart,
          lte: invoice.periodEnd
        }
      },
      select: { id: true }
    })

    console.log(`📦 Found ${directBookings.length} DirectBookings for this invoice`)

    // Create accounting entry
    const accountingEntryId = await createInvoiceBooking({
      invoiceId: invoice.id,
      workshopId: invoice.workshopId,
      workshopName: invoice.workshop.companyName,
      invoiceNumber: invoice.invoiceNumber,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
      directBookingIds: directBookings.map(b => b.id) // NEW: Pass DirectBooking IDs
    })

    console.log(`✅ Accounting entry created: ${accountingEntryId}`)

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        accountingEntryId,
        totalAmount: invoice.totalAmount
      }
    })

  } catch (error) {
    console.error('❌ Accounting test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
