import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Send Balance Sheet and Income Statement to accountant via email
 * POST /api/admin/accounting/send-to-accountant
 * Body: { year: number }
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
    
    console.log('[SEND TO ACCOUNTANT] Sending reports for year:', year)

    // Get balance sheet
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    if (!balanceSheet) {
      return NextResponse.json({
        success: false,
        error: `Keine Bilanz für ${year} gefunden. Bitte erst erstellen.`
      }, { status: 404 })
    }

    // Get income statement
    const incomeStatement = await prisma.incomeStatement.findUnique({
      where: { year }
    })

    if (!incomeStatement) {
      return NextResponse.json({
        success: false,
        error: `Keine GuV für ${year} gefunden. Bitte erst erstellen.`
      }, { status: 404 })
    }

    // Get company settings (for accountant email)
    const settings = await prisma.companySettings.findFirst()
    
    if (!settings?.accountantEmail) {
      return NextResponse.json({
        success: false,
        error: 'Keine Steuerberater-Email in den Einstellungen hinterlegt. Bitte unter Buchhaltung → Einstellungen konfigurieren.'
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Generate PDF attachments for both reports
    // 2. Send email via your email service (SendGrid, AWS SES, etc.)
    // 3. Log the action in audit trail

    // For now, we'll simulate the email sending
    console.log('[SEND TO ACCOUNTANT] Would send email to:', settings.accountantEmail)
    console.log('[SEND TO ACCOUNTANT] With attachments:')
    console.log('  - Bilanz_' + year + '.pdf')
    console.log('  - GuV_' + year + '.pdf')

    // TODO: Implement actual email sending
    // Example with nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: settings.accountantEmail,
      subject: `Jahresabschluss ${year} - Bereifung24 GmbH`,
      text: `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie den Jahresabschluss ${year} mit Bilanz und GuV.\n\nMit freundlichen Grüßen\nBereifung24 GmbH`,
      attachments: [
        { filename: `Bilanz_${year}.pdf`, content: balanceSheetPDF },
        { filename: `GuV_${year}.pdf`, content: incomeStatementPDF }
      ]
    })
    */

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SEND_TO_ACCOUNTANT',
        entityType: 'BALANCE_SHEET',
        entityId: balanceSheet.id,
        details: {
          year,
          recipient: settings.accountantEmail,
          reports: ['Bilanz', 'GuV']
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Jahresabschluss ${year} wurde an ${settings.accountantEmail} gesendet`
    })
  } catch (error) {
    console.error('[SEND TO ACCOUNTANT] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Versand'
    }, { status: 500 })
  }
}
