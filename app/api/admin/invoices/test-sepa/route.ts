import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPayment, formatAmountForGoCardless } from '@/lib/gocardless'

/**
 * TEST 4: Initiate SEPA payment for latest invoice
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST 4: Initiate SEPA payment')

    // Get latest invoice
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

    console.log(`💳 Checking SEPA mandate for: ${invoice.workshop.companyName}`)

    // Check if workshop has SEPA mandate
    // Valid statuses: pending_submission (before first payment), active (after first payment)
    const validStatuses = ['pending_submission', 'submitted', 'active']
    if (!invoice.workshop.sepaMandateId) {
      return NextResponse.json({
        success: false,
        error: `Workshop has no SEPA mandate set up.`
      }, { status: 400 })
    }

    if (!validStatuses.includes(invoice.workshop.sepaMandateStatus || '')) {
      return NextResponse.json({
        success: false,
        error: `Workshop SEPA mandate is not ready for payments. Status: ${invoice.workshop.sepaMandateStatus || 'none'}`
      }, { status: 400 })
    }

    console.log(`✅ SEPA mandate ready (${invoice.workshop.sepaMandateStatus})`)
    console.log(`💰 Creating payment for: ${invoice.totalAmount} EUR`)

    // Create SEPA payment
    const payment = await createPayment({
      mandateId: invoice.workshop.sepaMandateId,
      amount: formatAmountForGoCardless(parseFloat(invoice.totalAmount.toString())),
      currency: 'EUR',
      description: `Provision ${invoice.invoiceNumber}`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        workshopId: invoice.workshopId
      }
    })

    console.log(`✅ SEPA payment created: ${payment.id}`)

    // Update invoice with payment info
    await prisma.commissionInvoice.update({
      where: { id: invoice.id },
      data: {
        sepaPaymentId: payment.id,
        sepaStatus: payment.status
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentId: payment.id,
        paymentStatus: payment.status,
        amount: invoice.totalAmount
      }
    })

  } catch (error) {
    console.error('❌ SEPA test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
