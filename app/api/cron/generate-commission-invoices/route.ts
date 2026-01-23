import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createInvoice, markInvoiceAsSent, generateInvoiceNumber } from '@/lib/invoicing/invoiceService'
import { createInvoiceBooking } from '@/lib/invoicing/invoiceAccountingService'
import { generateInvoicePdf } from '@/lib/invoicing/invoicePdfService'
import { createPayment, formatAmountForGoCardless } from '@/lib/gocardless'

/**
 * POST /api/cron/generate-commission-invoices
 * 
 * Automatische monatliche Rechnungsgenerierung
 * Sollte am 1. des Monats um 09:00 Uhr ausgeführt werden
 * 
 * Workflow:
 * 1. Finde alle Workshops mit PENDING Provisionen vom Vormonat
 * 2. Gruppiere Provisionen nach Service-Typ
 * 3. Erstelle Rechnung mit Line Items
 * 4. Generiere PDF
 * 5. Erstelle Buchhaltungseintrag
 * 6. Versende Email
 * 7. Initiiere SEPA-Zahlung (falls Mandat vorhanden)
 * 8. Markiere Provisionen als BILLED
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

    // Get all workshops with PENDING commissions in period
    const workshops = await prisma.workshop.findMany({
      where: {
        commissions: {
          some: {
            status: 'PENDING',
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      },
      include: {
        commissions: {
          where: {
            status: 'PENDING',
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          },
          include: {
            booking: {
              include: {
                offer: true
              }
            }
          }
        }
      }
    })

    console.log(`🏪 Found ${workshops.length} workshops with pending commissions`)

    const results = {
      success: [] as string[],
      failed: [] as { workshopId: string; workshopName: string; error: string }[]
    }

    // Process each workshop
    for (const workshop of workshops) {
      try {
        console.log(`\n📝 Processing ${workshop.name}...`)

        // Group commissions by service type
        const lineItems = groupCommissionsByServiceType(workshop.commissions)

        if (lineItems.length === 0) {
          console.log(`⏭️  No valid commissions for ${workshop.name}`)
          continue
        }

        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
        const vatAmount = subtotal * 0.19 // 19% MwSt
        const totalAmount = subtotal + vatAmount

        console.log(`💰 Total: ${totalAmount.toFixed(2)} EUR (${workshop.commissions.length} commissions)`)

        // Create invoice
        const invoice = await createInvoice({
          workshopId: workshop.id,
          periodStart,
          periodEnd,
          lineItems,
          commissionIds: workshop.commissions.map(c => c.id),
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
          workshopName: workshop.name,
          invoiceNumber: invoice.invoiceNumber,
          periodStart,
          periodEnd,
          subtotal,
          vatAmount,
          totalAmount
        })
        console.log(`📊 Accounting entry created: ${accountingEntryId}`)

        // Send email
        await sendInvoiceEmail(invoice.id, workshop, pdfUrl)
        console.log(`📧 Email sent to ${workshop.email}`)

        // Initiate SEPA payment if mandate exists
        if (workshop.sepaMandateId && workshop.sepaMandateStatus === 'active') {
          try {
            const payment = await createPayment({
              mandateId: workshop.sepaMandateId,
              amount: formatAmountForGoCardless(totalAmount),
              currency: 'EUR',
              description: `Provision ${invoice.invoiceNumber}`,
              metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                workshopId: workshop.id
              }
            })

            await prisma.commissionInvoice.update({
              where: { id: invoice.id },
              data: {
                sepaPaymentId: payment.id,
                sepaStatus: payment.status
              }
            })

            console.log(`💳 SEPA payment initiated: ${payment.id}`)
          } catch (sepaError) {
            console.warn(`⚠️  SEPA payment failed for ${workshop.name}:`, sepaError)
            // Don't fail the whole process - invoice is still sent via email with bank transfer info
          }
        } else {
          console.log(`💰 No SEPA mandate - using bank transfer`)
        }

        // Mark commissions as BILLED
        await prisma.commission.updateMany({
          where: {
            id: { in: workshop.commissions.map(c => c.id) }
          },
          data: {
            status: 'BILLED',
            billedAt: new Date()
          }
        })

        console.log(`✅ ${workshop.commissions.length} commissions marked as BILLED`)

        results.success.push(workshop.id)
      } catch (error) {
        console.error(`❌ Error processing ${workshop.name}:`, error)
        results.failed.push({
          workshopId: workshop.id,
          workshopName: workshop.name,
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
 * Group commissions by service type and create line items
 */
function groupCommissionsByServiceType(commissions: any[]) {
  const groups = new Map<string, { count: number; total: number; description: string }>()

  for (const commission of commissions) {
    const serviceType = commission.booking?.offer?.packageType || 'UNKNOWN'
    const serviceName = commission.booking?.offer?.packageName || 'Sonstige Leistung'
    const amount = parseFloat(commission.amount.toString())

    if (!groups.has(serviceType)) {
      groups.set(serviceType, {
        count: 0,
        total: 0,
        description: getServiceDescription(serviceType, serviceName)
      })
    }

    const group = groups.get(serviceType)!
    group.count++
    group.total += amount
  }

  // Convert to line items
  let position = 1
  const lineItems = []

  for (const [serviceType, group] of groups) {
    lineItems.push({
      position: position++,
      description: group.description,
      quantity: group.count,
      unitPrice: group.total / group.count,
      total: group.total,
      vatRate: 19
    })
  }

  return lineItems
}

/**
 * Get human-readable service description
 */
function getServiceDescription(packageType: string, packageName: string): string {
  const descriptions: Record<string, string> = {
    'TIRES_WITH_ASSEMBLY': 'Reifen mit Montage',
    'WHEEL_CHANGE': 'Räder umstecken',
    'TIRE_HOTEL': 'Einlagerung',
    'REPAIR': 'Reparatur',
    'INSPECTION': 'Inspektion',
    'BRAKE_SERVICE': 'Bremsendienst',
    'OIL_CHANGE': 'Ölwechsel',
    'UNKNOWN': packageName || 'Sonstige Leistung'
  }

  return descriptions[packageType] || packageName || 'Vermittlungsleistung'
}

/**
 * Send invoice email to workshop
 */
async function sendInvoiceEmail(invoiceId: string, workshop: any, pdfUrl: string) {
  try {
    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        workshop: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invoice || !workshop.email) {
      throw new Error('Invoice or workshop email not found')
    }

    const emailSettings = await prisma.emailSettings.findFirst()
    if (!emailSettings) {
      throw new Error('Email settings not configured')
    }

    // Check for accountant email template or use default
    const template = await prisma.emailTemplate.findFirst({
      where: { slug: 'commission-invoice' }
    })

    const subject = template?.subject || `Provisionsabrechnung ${invoice.invoiceNumber}`
    
    const htmlBody = template?.htmlBody || `
      <h2>Provisionsabrechnung ${invoice.invoiceNumber}</h2>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>anbei erhalten Sie Ihre Provisionsabrechnung für den Zeitraum ${invoice.periodStart.toLocaleDateString('de-DE')} bis ${invoice.periodEnd.toLocaleDateString('de-DE')}.</p>
      <p><strong>Rechnungsbetrag: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.totalAmount)}</strong></p>
      ${invoice.sepaPaymentId 
        ? '<p>Der Betrag wird in den nächsten Tagen per SEPA-Lastschrift eingezogen.</p>'
        : `<p>Bitte überweisen Sie den Betrag bis zum ${invoice.dueDate?.toLocaleDateString('de-DE')} unter Angabe der Rechnungsnummer.</p>`
      }
      <p>Die Rechnung finden Sie im Anhang als PDF.</p>
      <p>Mit freundlichen Grüßen<br>Ihr Bereifung24 Team</p>
    `

    const plainBody = template?.plainBody || `
Provisionsabrechnung ${invoice.invoiceNumber}

Sehr geehrte Damen und Herren,

anbei erhalten Sie Ihre Provisionsabrechnung für den Zeitraum ${invoice.periodStart.toLocaleDateString('de-DE')} bis ${invoice.periodEnd.toLocaleDateString('de-DE')}.

Rechnungsbetrag: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.totalAmount)}

${invoice.sepaPaymentId 
  ? 'Der Betrag wird in den nächsten Tagen per SEPA-Lastschrift eingezogen.'
  : `Bitte überweisen Sie den Betrag bis zum ${invoice.dueDate?.toLocaleDateString('de-DE')} unter Angabe der Rechnungsnummer.`
}

Die Rechnung finden Sie im Anhang als PDF.

Mit freundlichen Grüßen
Ihr Bereifung24 Team
    `

    // Send email using existing email service
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      secure: emailSettings.smtpPort === 465,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword
      }
    })

    await transporter.sendMail({
      from: `"${emailSettings.senderName}" <${emailSettings.senderEmail}>`,
      to: workshop.email,
      subject,
      text: plainBody,
      html: htmlBody,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          path: `${process.cwd()}/public${pdfUrl}`
        }
      ]
    })

    console.log(`✅ Email sent to ${workshop.email}`)
  } catch (error) {
    console.error('❌ Error sending invoice email:', error)
    throw error
  }
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
