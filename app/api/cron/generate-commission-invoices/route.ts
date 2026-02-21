import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createInvoice, markInvoiceAsSent, generateInvoiceNumber } from '@/lib/invoicing/invoiceService'
import { createInvoiceBooking } from '@/lib/invoicing/invoiceAccountingService'
import { generateInvoicePdf } from '@/lib/invoicing/invoicePdfService'
import { sendInvoiceEmail } from '@/lib/invoicing/invoiceEmailService'

/**
 * POST /api/cron/generate-commission-invoices
 * 
 * Automatische monatliche Provisionsabrechnung
 * Sollte am 1. des Monats um 09:00 Uhr ausgeführt werden
 * 
 * Workflow:
 * 1. Finde alle Workshops mit bezahlten DirectBookings (paymentStatus='PAID', commissionBilledAt=null)
 * 2. Gruppiere nach Service-Typ
 * 3. Erstelle Rechnung mit Line Items
 * 4. Generiere PDF
 * 5. Erstelle Buchhaltungseintrag
 * 6. Versende Email mit Info über automatisch abgezogene Provision
 * 7. Markiere DirectBookings als abgerechnet (commissionBilledAt)
 * 
 * HINWEIS: Provision wurde bereits automatisch von Stripe abgezogen (6.9%)!
 * Die Rechnung dient nur der Dokumentation für die Werkstatt.
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Starting monthly commission invoice generation...')

    // Get target month (previous month)
    const now = new Date()
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    
    const periodStart = new Date(targetYear, targetMonth - 1, 1)
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59)

    console.log(`📅 Period: ${periodStart.toLocaleDateString('de-DE')} - ${periodEnd.toLocaleDateString('de-DE')}`)

    // Get all workshops with paid DirectBookings that haven't been billed yet
    const workshops = await prisma.workshop.findMany({
      where: {
        directBookings: {
          some: {
            paymentStatus: 'PAID',
            commissionBilledAt: null,
            paidAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        directBookings: {
          where: {
            paymentStatus: 'PAID',
            commissionBilledAt: null,
            paidAt: {
              gte: periodStart,
              lte: periodEnd
            }
          },
          include: {
            vehicle: true,
            customer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    console.log(`🏪 Found ${workshops.length} workshops with unbilled commissions`)

    const results = {
      success: [] as string[],
      failed: [] as { workshopId: string; workshopName: string; error: string }[]
    }

    // Process each workshop
    for (const workshop of workshops) {
      try {
        console.log(`\n📝 Processing ${workshop.companyName}...`)

        // Group DirectBooking commissions by service type
        const lineItems = groupDirectBookingsByServiceType(workshop.directBookings)

        if (lineItems.length === 0) {
          console.log(`⏭️  No valid commissions for ${workshop.companyName}`)
          continue
        }

        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
        const vatAmount = subtotal * 0.19 // 19% MwSt
        const totalAmount = subtotal + vatAmount

        console.log(`💰 Total: ${totalAmount.toFixed(2)} EUR (${workshop.directBookings.length} bookings)`)

        // Create invoice
        const invoice = await createInvoice({
          workshopId: workshop.id,
          periodStart,
          periodEnd,
          lineItems,
          commissionIds: [], // No commission IDs for DirectBookings
          createdBy: 'SYSTEM',
          notes: `Automatisch generiert am ${new Date().toLocaleDateString('de-DE')}`
        })

        console.log(`✅ Invoice created: ${invoice.invoiceNumber}`)

        // Generate PDF
        const pdfUrl = await generateInvoicePdf(invoice.id)
        await markInvoiceAsSent(invoice.id, pdfUrl)
        console.log(`📄 PDF generated: ${pdfUrl}`)

        // Create accounting entry
        const accountingEntryId = await createInvoiceBooking({
          invoiceId: invoice.id,
          workshopId: workshop.id,
          workshopName: workshop.companyName,
          invoiceNumber: invoice.invoiceNumber,
          periodStart,
          periodEnd,
          subtotal,
          vatAmount,
          totalAmount
        })
        console.log(`📊 Accounting entry created: ${accountingEntryId}`)

        // Send email
        const emailResult = await sendInvoiceEmail(invoice.id)
        console.log(`📧 Email sent to ${workshop.user.email}: ${emailResult.success ? 'success' : emailResult.error}`)

        // Note: Commission was already automatically deducted from Stripe payments (6.9%)
        console.log(`✅ Commission already deducted automatically via Stripe`)

        // Mark DirectBookings as billed
        await prisma.directBooking.updateMany({
          where: {
            id: { in: workshop.directBookings.map(b => b.id) }
          },
          data: {
            commissionBilledAt: new Date()
          }
        })

        console.log(`✅ ${workshop.directBookings.length} bookings marked as billed`)

        results.success.push(workshop.id)
      } catch (error) {
        console.error(`❌ Error processing ${workshop.companyName}:`, error)
        results.failed.push({
          workshopId: workshop.id,
          workshopName: workshop.companyName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`\n✨ Invoice generation completed!`)
    console.log(`✅ Success: ${results.success.length}`)
    console.log(`❌ Failed: ${results.failed.length}`)

    return NextResponse.json({
      success: true,
      summary: {
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString()
        },
        totalWorkshops: workshops.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        successWorkshops: results.success,
        failedWorkshops: results.failed
      }
    })
  } catch (error) {
    console.error('❌ Critical error in invoice generation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Group DirectBookings by service type and create line items
 * Each booking's commission becomes a separate line item with its date
 */
function groupDirectBookingsByServiceType(directBookings: any[]) {
  const lineItems = []
  let position = 1

  for (const booking of directBookings) {
    const serviceType = booking.serviceType
    const amount = booking.platformCommission ? parseFloat(booking.platformCommission.toString()) : 0
    const date = booking.paidAt || booking.createdAt

    // Skip if no commission amount
    if (amount <= 0) continue

    lineItems.push({
      position: position++,
      description: getServiceDescription(serviceType, booking),
      quantity: 1,
      unitPrice: amount,
      total: amount,
      vatRate: 19,
      date: date
    })
  }

  return lineItems
}

/**
 * Get human-readable service description for DirectBooking
 */
function getServiceDescription(serviceType: string, booking: any): string {
  const descriptions: Record<string, string> = {
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_CHANGE': 'Reifenwechsel',
    'TIRE_MOUNT': 'Reifenmontage',
    'TIRE_HOTEL': 'Einlagerung',
    'REPAIR': 'Reparatur',
    'INSPECTION': 'Inspektion',
    'BRAKE_SERVICE': 'Bremsendienst',
    'OIL_CHANGE': 'Ölwechsel'
  }

  let description = descriptions[serviceType] || 'Vermittlungsleistung'

  // Add tire details if available
  if (booking.tireBrand && booking.tireModel) {
    description += ` (${booking.tireBrand} ${booking.tireModel})`
  } else if (booking.tireSize) {
    description += ` (${booking.tireSize})`
  }

  return description
}

/**
 * GET /api/cron/generate-commission-invoices
 * Manual trigger endpoint (for testing)
 */
export async function GET(request: NextRequest) {
  // Allow manual trigger from admin interface
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return POST(request)
}
