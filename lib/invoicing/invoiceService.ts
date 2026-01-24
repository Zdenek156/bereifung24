import { prisma } from '@/lib/prisma'
import { CommissionInvoice } from '@prisma/client'

/**
 * Invoice Management Service
 * Handles invoice creation, numbering, and lifecycle
 */

export interface InvoiceLineItem {
  position: number
  description: string
  quantity: number
  unitPrice: number
  total: number
  vatRate: number
}

export interface CreateInvoiceData {
  workshopId: string
  periodStart: Date
  periodEnd: Date
  lineItems: InvoiceLineItem[]
  commissionIds: string[]
  createdBy?: string
  notes?: string
}

/**
 * Generate next invoice number
 * Format: B24-INV-{YEAR}-{NUMBER}
 * Example: B24-INV-2026-0001
 */
export async function generateInvoiceNumber(year?: number): Promise<string> {
  try {
    const currentYear = year || new Date().getFullYear()

    // Get or create invoice settings
    let settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' }
    })

    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.invoiceSettings.create({
        data: {
          id: 'default-settings',
          currentNumber: 1,
          prefix: 'B24-INV'
        }
      })
    }

    // Get current number and increment
    const number = settings.currentNumber
    const paddedNumber = number.toString().padStart(4, '0')
    const invoiceNumber = `${settings.prefix}-${currentYear}-${paddedNumber}`

    // Update counter
    await prisma.invoiceSettings.update({
      where: { id: 'default-settings' },
      data: { currentNumber: number + 1 }
    })

    return invoiceNumber
  } catch (error) {
    console.error('Error generating invoice number:', error)
    throw new Error(`Failed to generate invoice number: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a new commission invoice
 * Does NOT create accounting entry - use invoiceAccountingService for that
 */
export async function createInvoice(
  data: CreateInvoiceData
): Promise<CommissionInvoice> {
  try {
    const {
      workshopId,
      periodStart,
      periodEnd,
      lineItems,
      commissionIds,
      createdBy,
      notes
    } = data

    // Verify workshop exists
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true, companyName: true }
    })

    if (!workshop) {
      throw new Error(`Workshop ${workshopId} not found`)
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const vatAmount = subtotal * 0.19 // 19% MwSt
    const totalAmount = subtotal + vatAmount

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(periodEnd.getFullYear())

    // Calculate due date (14 days from period end)
    const dueDate = new Date(periodEnd)
    dueDate.setDate(dueDate.getDate() + 14)

    // Create invoice
    const invoice = await prisma.commissionInvoice.create({
      data: {
        invoiceNumber,
        workshop: {
          connect: { id: workshopId }
        },
        periodStart,
        periodEnd,
        lineItems: lineItems as any, // Prisma Json type
        subtotal,
        vatAmount,
        totalAmount,
        status: 'DRAFT',
        dueDate,
        commissionIds,
        createdBy,
        notes
      }
    })

    console.log(`✅ Rechnung ${invoiceNumber} erstellt für ${workshop.name}`)

    return invoice
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Mark invoice as sent (changes status to SENT)
 * Should be called after PDF generation and email sending
 */
export async function markInvoiceAsSent(
  invoiceId: string,
  pdfUrl: string
): Promise<CommissionInvoice> {
  try {
    const invoice = await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        pdfUrl
      }
    })

    console.log(`✅ Rechnung ${invoice.invoiceNumber} als versendet markiert`)

    return invoice
  } catch (error) {
    console.error('Error marking invoice as sent:', error)
    throw new Error(`Failed to mark invoice as sent: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Mark invoice as paid
 * Should be called when payment is received (SEPA or bank transfer)
 */
export async function markInvoiceAsPaid(
  invoiceId: string,
  paidAt: Date,
  paymentMethod: 'SEPA' | 'BANK_TRANSFER',
  reference?: string
): Promise<CommissionInvoice> {
  try {
    const invoice = await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt,
        notes: reference
          ? `Zahlung erhalten: ${paymentMethod} (Ref: ${reference})`
          : `Zahlung erhalten: ${paymentMethod}`
      }
    })

    console.log(`✅ Rechnung ${invoice.invoiceNumber} als bezahlt markiert`)

    return invoice
  } catch (error) {
    console.error('Error marking invoice as paid:', error)
    throw new Error(`Failed to mark invoice as paid: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Mark invoice as overdue
 * Should be called by cron job checking unpaid invoices past due date
 */
export async function markInvoiceAsOverdue(invoiceId: string): Promise<CommissionInvoice> {
  try {
    const invoice = await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: { status: 'OVERDUE' }
    })

    console.log(`⚠️  Rechnung ${invoice.invoiceNumber} ist überfällig`)

    return invoice
  } catch (error) {
    console.error('Error marking invoice as overdue:', error)
    throw new Error(`Failed to mark invoice as overdue: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all invoices for a workshop
 */
export async function getWorkshopInvoices(workshopId: string) {
  try {
    const invoices = await prisma.commissionInvoice.findMany({
      where: { workshopId },
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: {
          select: { name: true, email: true }
        },
        accountingEntry: true
      }
    })

    return invoices
  } catch (error) {
    console.error('Error fetching workshop invoices:', error)
    throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get invoices for a specific period
 */
export async function getInvoicesForPeriod(
  startDate: Date,
  endDate: Date,
  status?: string
) {
  try {
    const invoices = await prisma.commissionInvoice.findMany({
      where: {
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
        ...(status && { status })
      },
      orderBy: { invoiceNumber: 'desc' },
      include: {
        workshop: {
          select: { companyName: true, user: { select: { email: true } } }
        }
      }
    })

    return invoices
  } catch (error) {
    console.error('Error fetching invoices for period:', error)
    throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get overdue invoices (status SENT, past due date)
 */
export async function getOverdueInvoices() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const invoices = await prisma.commissionInvoice.findMany({
      where: {
        status: 'SENT',
        dueDate: { lt: today }
      },
      include: {
        workshop: {
          select: { id: true, companyName: true, phone: true, user: { select: { email: true } } }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    return invoices
  } catch (error) {
    console.error('Error fetching overdue invoices:', error)
    throw new Error(`Failed to fetch overdue invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update SEPA payment status
 * Called when GoCardless webhook notifies payment status change
 */
export async function updateSepaStatus(
  invoiceId: string,
  sepaPaymentId: string,
  sepaStatus: string
): Promise<CommissionInvoice> {
  try {
    const invoice = await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: {
        sepaPaymentId,
        sepaStatus,
        // Auto-mark as paid if status is 'paid_out' or 'confirmed'
        ...(sepaStatus === 'paid_out' || sepaStatus === 'confirmed'
          ? { status: 'PAID', paidAt: new Date() }
          : {})
      }
    })

    console.log(`✅ SEPA Status für Rechnung ${invoice.invoiceNumber} aktualisiert: ${sepaStatus}`)

    return invoice
  } catch (error) {
    console.error('Error updating SEPA status:', error)
    throw new Error(`Failed to update SEPA status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(year?: number) {
  try {
    const currentYear = year || new Date().getFullYear()
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59)

    const [total, paid, sent, overdue, cancelled] = await Promise.all([
      prisma.commissionInvoice.count({
        where: { periodStart: { gte: startDate }, periodEnd: { lte: endDate } }
      }),
      prisma.commissionInvoice.count({
        where: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
          status: 'PAID'
        }
      }),
      prisma.commissionInvoice.count({
        where: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
          status: 'SENT'
        }
      }),
      prisma.commissionInvoice.count({
        where: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
          status: 'OVERDUE'
        }
      }),
      prisma.commissionInvoice.count({
        where: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
          status: 'CANCELLED'
        }
      })
    ])

    const totalRevenue = await prisma.commissionInvoice.aggregate({
      where: {
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
        status: { in: ['SENT', 'PAID'] }
      },
      _sum: { totalAmount: true }
    })

    const paidRevenue = await prisma.commissionInvoice.aggregate({
      where: {
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
        status: 'PAID'
      },
      _sum: { totalAmount: true }
    })

    return {
      year: currentYear,
      total,
      paid,
      sent,
      overdue,
      cancelled,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      paidRevenue: paidRevenue._sum.totalAmount || 0,
      outstandingRevenue: (totalRevenue._sum.totalAmount || 0) - (paidRevenue._sum.totalAmount || 0)
    }
  } catch (error) {
    console.error('Error calculating invoice stats:', error)
    throw new Error(`Failed to calculate stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
