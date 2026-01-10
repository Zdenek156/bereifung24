import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SmtpService } from '@/lib/email/smtp-service'
import * as Handlebars from 'handlebars'

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

    // Get SMTP settings from AdminApiSetting (legacy) or CompanySettings (new)
    const emailSettingsArray = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM']
        }
      }
    })

    const smtpSettings = {
      smtpHost: emailSettingsArray.find(s => s.key === 'EMAIL_HOST')?.value || '',
      smtpPort: emailSettingsArray.find(s => s.key === 'EMAIL_PORT')?.value || '587',
      smtpUser: emailSettingsArray.find(s => s.key === 'EMAIL_USER')?.value || '',
      smtpPassword: emailSettingsArray.find(s => s.key === 'EMAIL_PASSWORD')?.value || '',
      smtpFrom: emailSettingsArray.find(s => s.key === 'EMAIL_FROM')?.value || '',
      smtpSecure: false
    }

    // Fallback to CompanySettings if AdminApiSetting is empty
    if (!smtpSettings.smtpHost) {
      const companySettings = await prisma.companySettings.findFirst()
      if (companySettings) {
        smtpSettings.smtpHost = companySettings.smtpHost || ''
        smtpSettings.smtpPort = companySettings.smtpPort || '587'
        smtpSettings.smtpUser = companySettings.smtpUser || ''
        smtpSettings.smtpPassword = companySettings.smtpPassword || ''
        smtpSettings.smtpFrom = companySettings.smtpFrom || ''
        smtpSettings.smtpSecure = companySettings.smtpSecure || false
      }
    }

    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: { key: 'ACCOUNTANT_DOCUMENTS' }
    })

    if (!emailTemplate || !emailTemplate.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Email-Template nicht gefunden oder inaktiv. Bitte in den Email-Templates aktivieren.'
      }, { status: 404 })
    }

    // Prepare template data
    const templateData = {
      year,
      senderName: sender,
      format: format.toUpperCase(),
      documents: attachments.map(a => a.name),
      message: message || null,
      accountantName: accountant.name || null,
      companyAddress: null
    }

    // Compile Handlebars template
    Handlebars.registerHelper('each', function(context, options) {
      let ret = ''
      for (let i = 0; i < context.length; i++) {
        ret += options.fn(context[i])
      }
      return ret
    })

    Handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this)
      }
      return options.inverse(this)
    })

    const subjectTemplate = Handlebars.compile(emailTemplate.subject)
    const htmlTemplate = Handlebars.compile(emailTemplate.htmlContent)

    const emailSubject = subjectTemplate(templateData)
    const emailHtml = htmlTemplate(templateData)

    // Send email via SMTP
    console.log('[SEND TO ACCOUNTANT] Preparing email...')
    console.log('[SEND TO ACCOUNTANT] To:', accountant.email)
    console.log('[SEND TO ACCOUNTANT] Subject:', emailSubject)

    if (!smtpSettings?.smtpHost || !smtpSettings?.smtpUser) {
      console.log('[SEND TO ACCOUNTANT] SMTP not configured, simulation only')
      return NextResponse.json({
        success: true,
        message: `${attachments.length} Dokument(e) würden versendet werden (SMTP nicht konfiguriert)`,
        data: {
          year,
          recipient: accountant.email,
          documents: attachments.map(a => a.name),
          format,
          simulation: true
        }
      })
    }

    try {
      // Generate PDF attachments
      const emailAttachments = []

      if (documents.balanceSheet) {
        try {
          const pdfResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/accounting/balance-sheet/export?year=${year}&format=pdf`, {
            headers: {
              'Cookie': request.headers.get('cookie') || ''
            }
          })
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer()
            emailAttachments.push({
              filename: `Bilanz_${year}.pdf`,
              content: Buffer.from(pdfBuffer)
            })
            console.log('[SEND TO ACCOUNTANT] Generated Bilanz PDF')
          }
        } catch (err) {
          console.error('[SEND TO ACCOUNTANT] Error generating Bilanz PDF:', err)
        }
      }

      if (documents.incomeStatement) {
        try {
          const pdfResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/accounting/income-statement/export?year=${year}&format=pdf`, {
            headers: {
              'Cookie': request.headers.get('cookie') || ''
            }
          })
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer()
            emailAttachments.push({
              filename: `GuV_${year}.pdf`,
              content: Buffer.from(pdfBuffer)
            })
            console.log('[SEND TO ACCOUNTANT] Generated GuV PDF')
          }
        } catch (err) {
          console.error('[SEND TO ACCOUNTANT] Error generating GuV PDF:', err)
        }
      }

      // Create SMTP service
      const smtpService = new SmtpService({
        host: smtpSettings.smtpHost,
        port: parseInt(smtpSettings.smtpPort || '587'),
        secure: smtpSettings.smtpSecure || false,
        auth: {
          user: smtpSettings.smtpUser,
          pass: smtpSettings.smtpPassword
        }
      })

      // Send email with attachments
      await smtpService.sendEmail({
        from: `${sender} <${smtpSettings.smtpFrom || smtpSettings.smtpUser}>`,
        to: accountant.email,
        subject: emailSubject,
        html: emailHtml,
        attachments: emailAttachments
      })

      console.log('[SEND TO ACCOUNTANT] ✅ Email sent successfully with', emailAttachments.length, 'attachments!')
    } catch (emailError) {
      console.error('[SEND TO ACCOUNTANT] Email error:', emailError)
      return NextResponse.json({
        success: false,
        error: `Email-Versand fehlgeschlagen: ${emailError instanceof Error ? emailError.message : 'Unbekannter Fehler'}`
      }, { status: 500 })
    }

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
    // TODO: Implement AuditLog model or use existing logging system
    /*
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
    */

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
