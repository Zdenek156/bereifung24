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
 * Buchungssatz:
 * SOLL 1400 (Forderungen aus Lieferungen und Leistungen) - Bruttobetrag
 * HABEN 8400 (Erlöse 19% USt) - Nettobetrag
 * HABEN 1776 (Umsatzsteuer 19%) - MwSt-Betrag
 * 
 * @param data Invoice data
 * @returns Created accounting entry ID
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
      totalAmount
    } = data

    // Generate entry number
    const entryNumber = await generateEntryNumber()

    // Format period for description
    const periodStr = `${periodStart.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} - ${periodEnd.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}`

    // Create invoice booking entry
    const entry = await prisma.accountingEntry.create({
      data: {
        entryNumber,
        bookingDate: new Date(),
        documentDate: periodEnd,
        
        // SOLL: Forderungen (1400)
        debitAccount: '1400',
        
        // HABEN: Erlöse (8400) + USt (1776) - wird durch Gegenkonto abgebildet
        creditAccount: '8400',
        
        // Amounts
        amount: new Decimal(totalAmount),
        netAmount: new Decimal(subtotal),
        vatRate: 19,
        vatAmount: new Decimal(vatAmount),
        
        // Description
        description: `Provisionsrechnung ${invoiceNumber} - ${workshopName}`,
        documentNumber: invoiceNumber,
        
        // Source tracking
        sourceType: 'COMMISSION',
        sourceId: invoiceId,
        
        // Created by system (can be overridden)
        createdById: null
      }
    })

    // Link accounting entry to invoice
    await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: { accountingEntryId: entry.id }
    })

    console.log(`✅ Buchungssatz für Rechnung ${invoiceNumber} erstellt: ${entry.id}`)
    
    return entry.id
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
