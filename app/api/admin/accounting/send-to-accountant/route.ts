import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SmtpService } from '@/lib/email/smtp-service'
import * as Handlebars from 'handlebars'
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
          const balanceSheetData = await prisma.balanceSheet.findUnique({
            where: { year }
          })
          if (balanceSheetData) {
            const pdfBuffer = await generateBalanceSheetPDF(balanceSheetData)
            emailAttachments.push({
              filename: `Bilanz_${year}.pdf`,
              content: pdfBuffer
            })
            console.log('[SEND TO ACCOUNTANT] Generated Bilanz PDF')
          }
        } catch (err) {
          console.error('[SEND TO ACCOUNTANT] Error generating Bilanz PDF:', err)
        }
      }

      if (documents.incomeStatement) {
        try {
          const incomeStatementData = await prisma.incomeStatement.findUnique({
            where: { year }
          })
          if (incomeStatementData) {
            const pdfBuffer = await generateIncomeStatementPDF(incomeStatementData)
            emailAttachments.push({
              filename: `GuV_${year}.pdf`,
              content: pdfBuffer
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
      
      return NextResponse.json({
        success: true,
        message: `Dokumente erfolgreich an ${accountant.email} gesendet`,
        attachments: emailAttachments.length
      })
    } catch (emailError) {
      console.error('[SEND TO ACCOUNTANT] Email error:', emailError)
      return NextResponse.json({
        success: false,
        error: `Email-Versand fehlgeschlagen: ${emailError instanceof Error ? emailError.message : 'Unbekannter Fehler'}`
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[SEND TO ACCOUNTANT] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Versand'
    }, { status: 500 })
  }
}

// Helper function to generate Bilanz PDF
async function generateBalanceSheetPDF(balanceSheet: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true
      })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Use built-in Courier font to avoid font loading issues
      doc.font('Courier')

      // Header
      doc.fontSize(20).text('BILANZ', { align: 'center' })
      doc.fontSize(12).text(`zum 31. Dezember ${balanceSheet.year}`, { align: 'center' })
      doc.moveDown()
      doc.fontSize(10).text('Bereifung24 GmbH', { align: 'center' })
      doc.moveDown(2)

      const assets = balanceSheet.assets as any
      const liabilities = balanceSheet.liabilities as any

      // AKTIVA
      doc.fontSize(14).text('AKTIVA', { underline: true })
      doc.moveDown()

      doc.fontSize(11).text('A. ANLAGEVERMÖGEN')
      doc.fontSize(10)
      doc.text(`   I. Immaterielle Vermögensgegenstände`, 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.anlagevermoegen?.immaterielleVermoegensgegenstaende || 0), { align: 'right' })
      doc.text(`   II. Sachanlagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.anlagevermoegen?.sachanlagen || 0), { align: 'right' })
      doc.text(`   III. Finanzanlagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.anlagevermoegen?.finanzanlagen || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('B. UMLAUFVERMÖGEN')
      doc.fontSize(10)
      doc.text(`   I. Vorräte`, 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.umlaufvermoegen?.vorraete || 0), { align: 'right' })
      doc.text(`   II. Forderungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.umlaufvermoegen?.forderungen || 0), { align: 'right' })
      doc.text(`   III. Kasse, Bank`, 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.umlaufvermoegen?.kasseBank || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('C. RECHNUNGSABGRENZUNGSPOSTEN', 50, doc.y, { continued: true })
      doc.text(formatEUR(assets.rechnungsabgrenzungsposten || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(12).text('SUMME AKTIVA', 50, doc.y, { continued: true, underline: true })
      doc.text(formatEUR(parseFloat(balanceSheet.totalAssets.toString())), { align: 'right', underline: true })
      doc.moveDown(2)

      // PASSIVA
      doc.fontSize(14).text('PASSIVA', { underline: true })
      doc.moveDown()

      doc.fontSize(11).text('A. EIGENKAPITAL')
      doc.fontSize(10)
      doc.text(`   I. Gezeichnetes Kapital`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.eigenkapital?.gezeichnetesKapital || 0), { align: 'right' })
      doc.text(`   II. Kapitalrücklagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.eigenkapital?.kapitalruecklagen || 0), { align: 'right' })
      doc.text(`   III. Gewinnrücklagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.eigenkapital?.gewinnruecklagen || 0), { align: 'right' })
      doc.text(`   IV. Gewinnvortrag`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.eigenkapital?.gewinnvortrag || 0), { align: 'right' })
      doc.text(`   V. Jahresüberschuss`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.eigenkapital?.jahresueberschuss || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('B. RÜCKSTELLUNGEN')
      doc.fontSize(10)
      doc.text(`   I. Pensionsrückstellungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.rueckstellungen?.pensionsrueckstellungen || 0), { align: 'right' })
      doc.text(`   II. Steuerrückstellungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.rueckstellungen?.steuerrueckstellungen || 0), { align: 'right' })
      doc.text(`   III. Sonstige Rückstellungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.rueckstellungen?.sonstigeRueckstellungen || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('C. VERBINDLICHKEITEN')
      doc.fontSize(10)
      doc.text(`   I. Verbindlichkeiten Kreditinstitute`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.verbindlichkeiten?.verbindlichkeitenKreditinstitute || 0), { align: 'right' })
      doc.text(`   II. Erhaltene Anzahlungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.verbindlichkeiten?.erhalteneAnzahlungen || 0), { align: 'right' })
      doc.text(`   III. Verbindlichkeiten Lieferungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.verbindlichkeiten?.verbindlichkeitenLieferungen || 0), { align: 'right' })
      doc.text(`   IV. Sonstige Verbindlichkeiten`, 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.verbindlichkeiten?.sonstigeVerbindlichkeiten || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('D. RECHNUNGSABGRENZUNGSPOSTEN', 50, doc.y, { continued: true })
      doc.text(formatEUR(liabilities.rechnungsabgrenzungsposten || 0), { align: 'right' })
      doc.moveDown()

      doc.fontSize(12).text('SUMME PASSIVA', 50, doc.y, { continued: true, underline: true })
      doc.text(formatEUR(parseFloat(balanceSheet.totalLiabilities.toString())), { align: 'right', underline: true })

      // Footer
      doc.moveDown(2)
      doc.fontSize(8).text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, { align: 'center' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper function to generate GuV PDF
async function generateIncomeStatementPDF(incomeStatement: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true
      })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Use built-in Courier font to avoid font loading issues
      doc.font('Courier')

      // Header
      doc.fontSize(20).text('GEWINN- UND VERLUSTRECHNUNG', { align: 'center' })
      doc.fontSize(12).text(`für das Geschäftsjahr ${incomeStatement.year}`, { align: 'center' })
      doc.moveDown()
      doc.fontSize(10).text('Bereifung24 GmbH', { align: 'center' })
      doc.moveDown(2)

      const revenue = incomeStatement.revenue as any
      const expenses = incomeStatement.expenses as any

      // ERTRÄGE
      doc.fontSize(14).text('ERTRÄGE', { underline: true })
      doc.moveDown()

      doc.fontSize(10)
      doc.text('1. Umsatzerlöse', 50, doc.y, { continued: true })
      doc.text(formatEUR(revenue.umsatzerloese || 0), { align: 'right' })
      doc.text('2. Bestandsveränderungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(revenue.bestandsveraenderungen || 0), { align: 'right' })
      doc.text('3. Andere aktivierte Eigenleistungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(revenue.andereAktivierteEigenleistungen || 0), { align: 'right' })
      doc.text('4. Sonstige betriebliche Erträge', 50, doc.y, { continued: true })
      doc.text(formatEUR(revenue.sonstigeBetrieblicheErtraege || 0), { align: 'right' })
      doc.moveDown()

      const totalRevenue = (revenue.umsatzerloese || 0) + 
                          (revenue.bestandsveraenderungen || 0) + 
                          (revenue.andereAktivierteEigenleistungen || 0) + 
                          (revenue.sonstigeBetrieblicheErtraege || 0)
      doc.fontSize(11).text('Summe Erträge', 50, doc.y, { continued: true })
      doc.text(formatEUR(totalRevenue), { align: 'right' })
      doc.moveDown(2)

      // AUFWENDUNGEN
      doc.fontSize(14).text('AUFWENDUNGEN', { underline: true })
      doc.moveDown()

      doc.fontSize(10)
      doc.text('5. Materialaufwand', 50, doc.y, { continued: true })
      doc.text(formatEUR(expenses.materialaufwand || 0), { align: 'right' })
      doc.text('6. Personalaufwand', 50, doc.y, { continued: true })
      doc.text(formatEUR(expenses.personalaufwand || 0), { align: 'right' })
      doc.text('7. Abschreibungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(expenses.abschreibungen || 0), { align: 'right' })
      doc.text('8. Sonstige betriebliche Aufwendungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(expenses.sonstigeBetrieblicheAufwendungen || 0), { align: 'right' })
      doc.text('9. Zinsen und ähnliche Aufwendungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(expenses.zinsenUndAehnlicheAufwendungen || 0), { align: 'right' })
      doc.text('10. Steuern', 50, doc.y, { continued: true })
      doc.text(formatEUR(expenses.steuern || 0), { align: 'right' })
      doc.moveDown()

      const totalExpenses = (expenses.materialaufwand || 0) + 
                           (expenses.personalaufwand || 0) + 
                           (expenses.abschreibungen || 0) + 
                           (expenses.sonstigeBetrieblicheAufwendungen || 0) + 
                           (expenses.zinsenUndAehnlicheAufwendungen || 0) + 
                           (expenses.steuern || 0)
      doc.fontSize(11).text('Summe Aufwendungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(totalExpenses), { align: 'right' })
      doc.moveDown(2)

      // JAHRESERGEBNIS
      const netIncome = parseFloat(incomeStatement.netIncome.toString())
      doc.fontSize(14).text('JAHRESERGEBNIS', 50, doc.y, { continued: true, underline: true })
      doc.text(formatEUR(netIncome), { align: 'right', underline: true })

      // Footer
      doc.moveDown(2)
      doc.fontSize(8).text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, { align: 'center' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper function to format currency
function formatEUR(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
