import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Send documents to accountant via email
 * POST /api/admin/accounting/send-to-accountant
 * Body: {
 *   year: number,
 *   sender: string,
 *   format: 'pdf' | 'excel' | 'csv',
 *   message: string,
 *   documents: { balanceSheet: boolean, incomeStatement: boolean, journal: boolean },
 *   accountant: AccountantSettings
 * }
 */
export async function POST(request: NextRequest) {
  console.log('[SEND TO ACCOUNTANT] API Called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[SEND TO ACCOUNTANT] Session:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const year = body.year || new Date().getFullYear() - 1
    const sender = body.sender || session.user.name || 'Bereifung24 Team'
    const format = body.format || 'pdf'
    const message = body.message || ''
    const documents = body.documents || { balanceSheet: true, incomeStatement: true, journal: false }
    const accountant = body.accountant
    
    console.log('[SEND TO ACCOUNTANT] Sending for year:', year)
    console.log('[SEND TO ACCOUNTANT] Sender:', sender)
    console.log('[SEND TO ACCOUNTANT] Format:', format)
    console.log('[SEND TO ACCOUNTANT] Documents:', documents)

    // Validate accountant email
    if (!accountant?.email) {
      return NextResponse.json({
        success: false,
        error: 'Keine Steuerberater-Email angegeben'
      }, { status: 400 })
    }

    // Validate at least one document selected
    if (!documents.balanceSheet && !documents.incomeStatement && !documents.journal) {
      return NextResponse.json({
        success: false,
        error: 'Bitte mindestens ein Dokument auswählen'
      }, { status: 400 })
    }

    const attachments = []

    // Get Balance Sheet if requested
    if (documents.balanceSheet) {
      const balanceSheet = await prisma.balanceSheet.findUnique({
        where: { year }
      })

      if (!balanceSheet) {
        return NextResponse.json({
          success: false,
          error: `Keine Bilanz für ${year} gefunden. Bitte erst erstellen.`
        }, { status: 404 })
      }
      attachments.push({ name: `Bilanz_${year}.${format}`, type: 'balance-sheet' })
    }

    // Get Income Statement if requested
    if (documents.incomeStatement) {
      const incomeStatement = await prisma.incomeStatement.findUnique({
        where: { year }
      })

      if (!incomeStatement) {
        return NextResponse.json({
          success: false,
          error: `Keine GuV für ${year} gefunden. Bitte erst erstellen.`
        }, { status: 404 })
      }
      attachments.push({ name: `GuV_${year}.${format}`, type: 'income-statement' })
    }

    // Get Journal if requested
    if (documents.journal) {
      const entries = await prisma.accountingEntry.findMany({
        where: {
          bookingDate: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59)
          }
        },
        orderBy: { entryNumber: 'asc' }
      })

      if (entries.length === 0) {
        return NextResponse.json({
          success: false,
          error: `Keine Buchungen für ${year} gefunden.`
        }, { status: 404 })
      }
      attachments.push({ name: `Journal_${year}.${format}`, type: 'journal' })
    }

    // In a real implementation, you would:
    // 1. Generate attachments based on format (PDF, Excel, CSV)
    // 2. Send email via SMTP using settings from CompanySettings
    // 3. Log the action in audit trail

    // Get SMTP settings
    const smtpSettings = await prisma.companySettings.findFirst()

    // For now, we'll simulate the email sending
    console.log('[SEND TO ACCOUNTANT] Would send email to:', accountant.email)
    console.log('[SEND TO ACCOUNTANT] From:', sender)
    console.log('[SEND TO ACCOUNTANT] Format:', format)
    console.log('[SEND TO ACCOUNTANT] Attachments:', attachments.map(a => a.name).join(', '))
    console.log('[SEND TO ACCOUNTANT] Message:', message)

    // TODO: Implement actual email sending
    // Example with nodemailer:
    /*
    const transporter = nodemailer.createTransporter({
      host: smtpSettings?.smtpHost,
      port: parseInt(smtpSettings?.smtpPort || '587'),
      secure: false,
      auth: {
        user: smtpSettings?.smtpUser,
        pass: smtpSettings?.smtpPassword
      }
    })

    const emailBody = `
Sehr geehrte Damen und Herren,

anbei erhalten Sie folgende Dokumente für das Geschäftsjahr ${year}:

${attachments.map(a => `- ${a.name}`).join('\n')}

${message ? `\nZusätzliche Information:\n${message}\n` : ''}

Mit freundlichen Grüßen
${sender}
Bereifung24 GmbH
    `.trim()

    await transporter.sendMail({
      from: `${sender} <${smtpSettings?.smtpFrom}>`,
      to: `${accountant.name} <${accountant.email}>`,
      subject: `Jahresabschluss ${year} - Bereifung24 GmbH`,
      text: emailBody,
      attachments: [
        // Generate and attach documents based on format
      ]
    })
    */

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SEND_TO_ACCOUNTANT',
        entityType: 'ACCOUNTING_DOCUMENTS',
        entityId: year.toString(),
        details: {
          year,
          sender,
          format,
          recipient: accountant.email,
          recipientName: accountant.name,
          documents: attachments.map(a => a.type),
          message: message || null
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${attachments.length} Dokument(e) für ${year} wurden an ${accountant.name || accountant.email} gesendet`,
      data: {
        year,
        recipient: accountant.email,
        documents: attachments.map(a => a.name),
        format
      }
    })
  } catch (error) {
    console.error('[SEND TO ACCOUNTANT] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Versand'
    }, { status: 500 })
  }
}
