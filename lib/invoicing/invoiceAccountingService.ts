import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Invoice Accounting Service
 * Creates accounting entries for commission invoices (SKR04)
 */

interface InvoiceBookingData {
  invoiceId: string
  workshopId: string
  workshopName: string
  invoiceNumber: string
  periodStart: Date
  periodEnd: Date
  subtotal: number
  vatAmount: number
  totalAmount: number
  directBookingIds?: string[] // NEW: IDs for aggregating commission/fee data
}

interface PaymentBookingData {
  invoiceId: string
  invoiceNumber: string
  workshopName: string
  amount: number
  paymentDate: Date
  paymentMethod: 'SEPA' | 'BANK_TRANSFER'
  reference?: string
}

/**
 * Calculate payment processing fee based on payment method
 * 
 * Fee Structures (Stripe):
 * - CARD/SEPA: 1,5% + 0,25€ (europäische Karten)
 * - PayPal:    3,5% + 0,25€ (PayPal über Stripe)
 * 
 * Quelle: Stripe-Preisgestaltung 2024/2025 für Deutschland
 * 
 * @param orderAmount The order total (Auftragssumme)
 * @param paymentMethod Payment method used
 * @returns Payment processing fee in EUR
 */
function calculatePaymentFee(
  orderAmount: number, 
  paymentMethod: string
): number {
  if (paymentMethod === 'PAYPAL') {
    // PayPal über Stripe: 3,5% + 0,25€
    return (orderAmount * 0.035) + 0.25
  } else {
    // Stripe Karten/SEPA: 1,5% + 0,25€
    return (orderAmount * 0.015) + 0.25
  }
}

/**
 * Generate next entry number for accounting entry
 * Format: BEL-YYYY-NNNNN (e.g. BEL-2026-00001)
 */
async function generateEntryNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `BEL-${year}-`
  
  // Find highest entry number for current year
  const lastEntry = await prisma.accountingEntry.findFirst({
    where: {
      entryNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      entryNumber: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastEntry) {
    // Extract number from BEL-2026-00123 -> 123
    const match = lastEntry.entryNumber.match(/BEL-\d{4}-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }
  
  // Format: BEL-2026-00001
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`
}

/**
 * Create accounting entry when invoice is generated
 * 
 * NEW: Stripe Commission System (6.9%)
 * Creates TWO booking entries:
 * 
 * 1. Commission Income (Brutto-Provision)
 *    SOLL 1200 (Bank)               → platformCommission (6,90€)
 *    HABEN 8400 (Erlöse)            → netAmount (5,80€)
 *    HABEN 1776 (USt 19%)           → vatAmount (1,10€)
 * 
 * 2. Stripe Payment Fees
 *    SOLL 6827 (Zahlungsverkehrsgebühren) → stripeFeesEstimate (1,75€)
 *    HABEN 1200 (Bank)                     → stripeFeesEstimate (1,75€)
 * 
 * Result: Net commission = 6,90€ - 1,75€ = 5,15€ (platformNetCommission) ✅
 * 
 * @param data Invoice data with optional directBookingIds
 * @returns Created accounting entry ID (main commission entry)
 */
export async function createInvoiceBooking(
  data: InvoiceBookingData
): Promise<string> {
  try {
    const {
      invoiceId,
      workshopName,
      invoiceNumber,
      periodStart,
      periodEnd,
      subtotal,
      vatAmount,
      totalAmount,
      directBookingIds
    } = data

    // Format period for description
    const periodStr = `${periodStart.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} - ${periodEnd.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}`

    // If directBookingIds provided, aggregate Stripe data
    let platformCommissionTotal = 0
    let stripeFeesTotal = 0
    let paypalFeesTotal = 0
    let platformNetCommissionTotal = 0

    if (directBookingIds && directBookingIds.length > 0) {
      const bookings = await prisma.directBooking.findMany({
        where: { id: { in: directBookingIds } },
        select: {
          platformCommission: true,
          totalPrice: true,
          paymentMethodDetail: true,
          stripeFee: true // NEW: Actual fee from Stripe webhook
        }
      })

      // Calculate fees based on actual Stripe data or fallback to estimate
      for (const booking of bookings) {
        const commission = booking.platformCommission ? parseFloat(booking.platformCommission.toString()) : 0
        const orderAmount = booking.totalPrice ? parseFloat(booking.totalPrice.toString()) : 0
        const paymentMethodDetail = booking.paymentMethodDetail || 'card'
        
        platformCommissionTotal += commission
        
        // Use actual Stripe fee if available, otherwise estimate
        let paymentFee: number
        
        if (booking.stripeFee) {
          // Use actual fee from Stripe Balance Transaction
          paymentFee = parseFloat(booking.stripeFee.toString())
          console.log(`  ✅ Using actual Stripe fee: ${paymentFee.toFixed(2)}€ (${paymentMethodDetail})`)
        } else {
          // Fallback: Calculate based on payment method
          paymentFee = calculatePaymentFee(orderAmount, paymentMethodDetail.toUpperCase())
          console.log(`  ⚠️ Estimating fee: ${paymentFee.toFixed(2)}€ (${paymentMethodDetail}) - actual fee not recorded`)
        }
        
        // Aggregate by payment type (for reporting)
        if (paymentMethodDetail.toLowerCase().includes('paypal')) {
          paypalFeesTotal += paymentFee
        } else {
          stripeFeesTotal += paymentFee
        }
      }

      // Net commission = commission - payment fees
      platformNetCommissionTotal = platformCommissionTotal - stripeFeesTotal - paypalFeesTotal

      console.log(`📊 Commission breakdown:`)
      console.log(`  • Platform Commission (Brutto): ${platformCommissionTotal.toFixed(2)}€`)
      console.log(`  • Stripe Fees:                  ${stripeFeesTotal.toFixed(2)}€`)
      console.log(`  • PayPal Fees:                  ${paypalFeesTotal.toFixed(2)}€`)
      console.log(`  • Total Fees:                   ${(stripeFeesTotal + paypalFeesTotal).toFixed(2)}€`)
      console.log(`  • Net Commission (after fees):  ${platformNetCommissionTotal.toFixed(2)}€`)
    } else {
      // Fallback: Use invoice totals if no DirectBooking data
      platformCommissionTotal = totalAmount
      console.log(`⚠️  No DirectBooking data - using invoice total: ${platformCommissionTotal.toFixed(2)}€`)
    }

    // Generate entry number for commission
    const commissionEntryNumber = await generateEntryNumber()

    // ====================================
    // 1. COMMISSION INCOME BOOKING
    // ====================================
    const commissionEntry = await prisma.accountingEntry.create({
      data: {
        entryNumber: commissionEntryNumber,
        bookingDate: new Date(),
        documentDate: periodEnd,
        
        // SOLL: Bank (1200) - we received the commission
        debitAccount: '1200',
        
        // HABEN: Erlöse Provisionen (8400) + USt (1776)
        creditAccount: '8400',
        
        // Amounts: Use platformCommission (brutto)
        amount: new Decimal(platformCommissionTotal),
        netAmount: new Decimal(platformCommissionTotal / 1.19), // Net without VAT
        vatRate: 19,
        vatAmount: new Decimal((platformCommissionTotal / 1.19) * 0.19), // 19% VAT
        
        // Description
        description: `Provisionseinnahme ${invoiceNumber} - ${workshopName} (${periodStr})`,
        documentNumber: invoiceNumber,
        
        // Source tracking
        sourceType: 'COMMISSION',
        sourceId: invoiceId,
        
        // Created by system
        createdById: null
      }
    })

    console.log(`✅ Provisionseinnahme gebucht: ${commissionEntryNumber} - ${platformCommissionTotal.toFixed(2)}€`)

    // ====================================
    // 2. STRIPE FEES BOOKING (if applicable)
    // ====================================
    if (stripeFeesTotal > 0.01) {
      const feesEntryNumber = await generateEntryNumber()

      await prisma.accountingEntry.create({
        data: {
          entryNumber: feesEntryNumber,
          bookingDate: new Date(),
          documentDate: periodEnd,
          
          // SOLL: Zahlungsverkehrsgebühren (6827) - expense
          debitAccount: '6827',
          
          // HABEN: Bank (1200) - paid from our account
          creditAccount: '1200',
          
          // Amount: Stripe fees (no VAT - already paid by Stripe)
          amount: new Decimal(stripeFeesTotal),
          netAmount: new Decimal(stripeFeesTotal),
          vatRate: 0,
          vatAmount: new Decimal(0),
          
          // Description
          description: `Stripe-Gebühren ${invoiceNumber} - ${workshopName} (${periodStr})`,
          documentNumber: invoiceNumber,
          
          // Source tracking
          sourceType: 'COMMISSION',
          sourceId: invoiceId,
          
          // Created by system
          createdById: null
        }
      })

      console.log(`✅ Stripe-Gebühren gebucht: ${feesEntryNumber} - ${stripeFeesTotal.toFixed(2)}€`)
    }

    // ====================================
    // 3. PAYPAL FEES BOOKING (if applicable)
    // ====================================
    if (paypalFeesTotal > 0.01) {
      const feesEntryNumber = await generateEntryNumber()

      await prisma.accountingEntry.create({
        data: {
          entryNumber: feesEntryNumber,
          bookingDate: new Date(),
          documentDate: periodEnd,
          
          // SOLL: Zahlungsverkehrsgebühren (6827) - expense
          debitAccount: '6827',
          
          // HABEN: Bank (1200) - paid from our account
          creditAccount: '1200',
          
          // Amount: PayPal fees (no VAT - already paid by PayPal)
          amount: new Decimal(paypalFeesTotal),
          netAmount: new Decimal(paypalFeesTotal),
          vatRate: 0,
          vatAmount: new Decimal(0),
          
          // Description
          description: `PayPal-Gebühren ${invoiceNumber} - ${workshopName} (${periodStr})`,
          documentNumber: invoiceNumber,
          
          // Source tracking
          sourceType: 'COMMISSION',
          sourceId: invoiceId,
          
          // Created by system
          createdById: null
        }
      })

      console.log(`✅ PayPal-Gebühren gebucht: ${feesEntryNumber} - ${paypalFeesTotal.toFixed(2)}€`)
    }

    // Link accounting entry to invoice
    await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: { accountingEntryId: commissionEntry.id }
    })

    const totalFees = stripeFeesTotal + paypalFeesTotal

    console.log(`✅ Buchhaltung komplett für ${invoiceNumber}:`)
    console.log(`   Einnahme:      ${platformCommissionTotal.toFixed(2)}€`)
    console.log(`   Stripe-Fees:   ${stripeFeesTotal.toFixed(2)}€`)
    console.log(`   PayPal-Fees:   ${paypalFeesTotal.toFixed(2)}€`)
    console.log(`   Gesamt-Fees:   ${totalFees.toFixed(2)}€`)
    console.log(`   Netto:         ${platformNetCommissionTotal.toFixed(2)}€`)
    
    return commissionEntry.id
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Buchungssatzes:', error)
    throw new Error(`Failed to create invoice booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create accounting entry when payment is received
 * 
 * Buchungssatz:
 * SOLL 1200 (Bank) - Zahlungsbetrag
 * HABEN 1400 (Forderungen) - Zahlungsbetrag
 * 
 * @param data Payment data
 * @returns Created accounting entry ID
 */
export async function createPaymentBooking(
  data: PaymentBookingData
): Promise<string> {
  try {
    const {
      invoiceId,
      invoiceNumber,
      workshopName,
      amount,
      paymentDate,
      paymentMethod,
      reference
    } = data

    // Get invoice to verify amount
    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: invoiceId },
      select: { totalAmount: true }
    })

    if (!invoice) {
      throw new Error(`Invoice ${invoiceNumber} not found`)
    }

    // Verify payment amount matches invoice total
    if (Math.abs(amount - invoice.totalAmount) > 0.01) {
      console.warn(`⚠️  Zahlungsbetrag ${amount} weicht von Rechnungsbetrag ${invoice.totalAmount} ab`)
    }

    // Determine payment description
    const methodStr = paymentMethod === 'SEPA' ? 'SEPA-Lastschrift' : 'Banküberweisung'
    const refStr = reference ? ` - Ref: ${reference}` : ''

    // Generate entry number
    const entryNumber = await generateEntryNumber()

    // Create payment booking entry
    const entry = await prisma.accountingEntry.create({
      data: {
        entryNumber,
        bookingDate: paymentDate,
        documentDate: paymentDate,
        
        // SOLL: Bank (1200)
        debitAccount: '1200',
        
        // HABEN: Forderungen (1400)
        creditAccount: '1400',
        
        // Amount (no VAT - already booked in invoice)
        amount: new Decimal(amount),
        netAmount: new Decimal(amount),
        vatRate: 0,
        vatAmount: new Decimal(0),
        
        // Description
        description: `Zahlungseingang ${methodStr} - ${workshopName} - ${invoiceNumber}${refStr}`,
        documentNumber: invoiceNumber,
        
        // Source tracking
        sourceType: 'COMMISSION',
        sourceId: invoiceId,
        
        // Created by system
        createdById: null
      }
    })

    // Mark invoice as paid
    await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: paymentDate
      }
    })

    console.log(`✅ Zahlungsbuchung für Rechnung ${invoiceNumber} erstellt: ${entry.id}`)
    
    return entry.id
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Zahlungsbuchung:', error)
    throw new Error(`Failed to create payment booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Reverse (storno) invoice booking
 * Creates counter-entry to cancel invoice accounting
 * 
 * @param invoiceId Invoice to storno
 * @param reason Reason for cancellation
 * @returns Created storno entry ID
 */
export async function stornoInvoiceBooking(
  invoiceId: string,
  reason: string
): Promise<string> {
  try {
    // Get invoice with accounting entry
    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        accountingEntry: true,
        workshop: {
          select: { name: true }
        }
      }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    if (!invoice.accountingEntry) {
      throw new Error('No accounting entry found for this invoice')
    }

    // Check if already cancelled
    if (invoice.status === 'CANCELLED') {
      throw new Error('Invoice is already cancelled')
    }

    // Create storno entry (reverse debit/credit)
    const stornoEntry = await prisma.accountingEntry.create({
      data: {
        bookingDate: new Date(),
        documentDate: new Date(),
        
        // Reverse: SOLL becomes HABEN, HABEN becomes SOLL
        debitAccount: invoice.accountingEntry.creditAccount,
        creditAccount: invoice.accountingEntry.debitAccount,
        
        // Same amounts (negative effect)
        amount: invoice.accountingEntry.amount,
        netAmount: invoice.accountingEntry.netAmount,
        vatRate: invoice.accountingEntry.vatRate,
        vatAmount: invoice.accountingEntry.vatAmount,
        
        // Description with storno reference
        description: `STORNO: ${invoice.accountingEntry.description}`,
        internalNote: `Grund: ${reason}`,
        
        // Reference original entry
        documentNumber: `STORNO-${invoice.invoiceNumber}`,
        documentType: 'STORNO',
        
        // Source tracking
        sourceType: 'COMMISSION_INVOICE',
        sourceId: invoiceId,
        
        // Status
        status: 'POSTED',
        
        // Created by system
        createdBy: 'SYSTEM'
      }
    })

    // Mark invoice as cancelled
    await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        notes: `${invoice.notes || ''}\n\nStorniert: ${reason}`
      }
    })

    console.log(`✅ Storno-Buchung für Rechnung ${invoice.invoiceNumber} erstellt: ${stornoEntry.id}`)
    
    return stornoEntry.id
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Storno-Buchung:', error)
    throw new Error(`Failed to storno invoice booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all accounting entries for an invoice
 * Includes invoice booking, payment bookings, and storno entries
 */
export async function getInvoiceAccountingEntries(invoiceId: string) {
  try {
    const entries = await prisma.accountingEntry.findMany({
      where: {
        sourceType: 'COMMISSION_INVOICE',
        sourceId: invoiceId
      },
      orderBy: {
        bookingDate: 'asc'
      }
    })

    return entries
  } catch (error) {
    console.error('Error fetching invoice accounting entries:', error)
    throw new Error(`Failed to fetch accounting entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
