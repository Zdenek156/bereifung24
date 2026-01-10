import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SmtpService } from '@/lib/email/smtp-service'
import * as Handlebars from 'handlebars'
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'

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
      // Generate attachments based on format
      const emailAttachments = []

      if (documents.balanceSheet) {
        try {
          const balanceSheetData = await prisma.balanceSheet.findUnique({
            where: { year }
          })
          if (balanceSheetData) {
            console.log(`[SEND TO ACCOUNTANT] Generating Bilanz ${format.toUpperCase()}...`)
            let buffer: Buffer
            let contentType: string
            let extension: string

            if (format === 'pdf') {
              buffer = await generateBalanceSheetPDF(balanceSheetData)
              contentType = 'application/pdf'
              extension = 'pdf'
            } else if (format === 'excel') {
              buffer = await generateBalanceSheetExcel(balanceSheetData, year)
              contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              extension = 'xlsx'
            } else { // csv
              buffer = Buffer.from(generateBalanceSheetCSV(balanceSheetData, year), 'utf-8')
              contentType = 'text/csv'
              extension = 'csv'
            }

            console.log(`[SEND TO ACCOUNTANT] Bilanz ${format.toUpperCase()} generated, size:`, buffer.length, 'bytes')
            emailAttachments.push({
              filename: `Bilanz_${year}.${extension}`,
              content: buffer,
              contentType
            })
            console.log(`[SEND TO ACCOUNTANT] ✅ Bilanz ${format.toUpperCase()} added to attachments`)
          }
        } catch (err) {
          console.error(`[SEND TO ACCOUNTANT] ❌ Error generating Bilanz ${format.toUpperCase()}:`, err)
          throw new Error(`Fehler beim Erstellen der Bilanz: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
        }
      }

      if (documents.incomeStatement) {
        try {
          const incomeStatementData = await prisma.incomeStatement.findUnique({
            where: { year }
          })
          if (incomeStatementData) {
            console.log(`[SEND TO ACCOUNTANT] Generating GuV ${format.toUpperCase()}...`)
            let buffer: Buffer
            let contentType: string
            let extension: string

            if (format === 'pdf') {
              buffer = await generateIncomeStatementPDF(incomeStatementData)
              contentType = 'application/pdf'
              extension = 'pdf'
            } else if (format === 'excel') {
              buffer = await generateIncomeStatementExcel(incomeStatementData, year)
              contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              extension = 'xlsx'
            } else { // csv
              buffer = Buffer.from(generateIncomeStatementCSV(incomeStatementData, year), 'utf-8')
              contentType = 'text/csv'
              extension = 'csv'
            }

            console.log(`[SEND TO ACCOUNTANT] GuV ${format.toUpperCase()} generated, size:`, buffer.length, 'bytes')
            emailAttachments.push({
              filename: `GuV_${year}.${extension}`,
              content: buffer,
              contentType
            })
            console.log(`[SEND TO ACCOUNTANT] ✅ GuV ${format.toUpperCase()} added to attachments`)
          }
        } catch (err) {
          console.error(`[SEND TO ACCOUNTANT] ❌ Error generating GuV ${format.toUpperCase()}:`, err)
          throw new Error(`Fehler beim Erstellen der GuV: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
        }
      }

      if (documents.journal) {
        try {
          const journalEntries = await prisma.accountingEntry.findMany({
            where: {
              bookingDate: {
                gte: new Date(year, 0, 1),
                lte: new Date(year, 11, 31, 23, 59, 59)
              }
            },
            orderBy: { entryNumber: 'asc' }
          })
          if (journalEntries.length > 0) {
            console.log(`[SEND TO ACCOUNTANT] Generating Journal ${format.toUpperCase()}...`)
            let buffer: Buffer
            let contentType: string
            let extension: string

            if (format === 'pdf') {
              buffer = await generateJournalPDF(journalEntries, year)
              contentType = 'application/pdf'
              extension = 'pdf'
            } else if (format === 'excel') {
              buffer = await generateJournalExcel(journalEntries, year)
              contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              extension = 'xlsx'
            } else { // csv
              buffer = Buffer.from(generateJournalCSV(journalEntries, year), 'utf-8')
              contentType = 'text/csv'
              extension = 'csv'
            }

            console.log(`[SEND TO ACCOUNTANT] Journal ${format.toUpperCase()} generated, size:`, buffer.length, 'bytes')
            emailAttachments.push({
              filename: `Journal_${year}.${extension}`,
              content: buffer,
              contentType
            })
            console.log(`[SEND TO ACCOUNTANT] ✅ Journal ${format.toUpperCase()} added to attachments`)
          }
        } catch (err) {
          console.error(`[SEND TO ACCOUNTANT] ❌ Error generating Journal ${format.toUpperCase()}:`, err)
          throw new Error(`Fehler beim Erstellen des Journals: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
        }
      }

      console.log('[SEND TO ACCOUNTANT] Total attachments prepared:', emailAttachments.length)

      // Create SMTP service
      console.log('[SEND TO ACCOUNTANT] Creating SMTP service...')
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
      console.log('[SEND TO ACCOUNTANT] Sending email to:', accountant.email)
      console.log('[SEND TO ACCOUNTANT] From:', `${sender} <${smtpSettings.smtpFrom || smtpSettings.smtpUser}>`)
      console.log('[SEND TO ACCOUNTANT] Subject:', emailSubject)
      console.log('[SEND TO ACCOUNTANT] Attachments:', emailAttachments.length)
      console.log('[SEND TO ACCOUNTANT] Attachment details:', emailAttachments.map(a => `${a.filename} (${a.content.length} bytes)`).join(', '))
      
      // Debug: Log each attachment structure
      emailAttachments.forEach((att, idx) => {
        console.log(`[SEND TO ACCOUNTANT] Attachment ${idx + 1}:`, {
          filename: att.filename,
          contentType: att.contentType,
          contentLength: att.content?.length || 0,
          contentIsBuffer: Buffer.isBuffer(att.content)
        })
      })
      
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
        attachments: emailAttachments.length,
        attachmentDetails: emailAttachments.map(a => ({
          filename: a.filename,
          size: a.content.length
        }))
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
        bufferPages: true,
        autoFirstPage: false
      })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Add page manually to control font initialization
      doc.addPage()
      
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
      doc.text(formatEUR(toNumber(assets.anlagevermoegen?.immaterielleVermoegensgegenstaende)), { align: 'right' })
      doc.text(`   II. Sachanlagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(assets.anlagevermoegen?.sachanlagen)), { align: 'right' })
      doc.text(`   III. Finanzanlagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(assets.anlagevermoegen?.finanzanlagen)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('B. UMLAUFVERMÖGEN')
      doc.fontSize(10)
      doc.text(`   I. Vorräte`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(assets.umlaufvermoegen?.vorraete)), { align: 'right' })
      doc.text(`   II. Forderungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(assets.umlaufvermoegen?.forderungen)), { align: 'right' })
      doc.text(`   III. Kasse, Bank`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(assets.umlaufvermoegen?.kasseBank)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('C. RECHNUNGSABGRENZUNGSPOSTEN', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(assets.rechnungsabgrenzungsposten)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(12).text('SUMME AKTIVA', 50, doc.y, { continued: true, underline: true })
      doc.text(formatEUR(toNumber(balanceSheet.totalAssets)), { align: 'right', underline: true })
      doc.moveDown(2)

      // PASSIVA
      doc.fontSize(14).text('PASSIVA', { underline: true })
      doc.moveDown()

      doc.fontSize(11).text('A. EIGENKAPITAL')
      doc.fontSize(10)
      doc.text(`   I. Gezeichnetes Kapital`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.eigenkapital?.gezeichnetesKapital)), { align: 'right' })
      doc.text(`   II. Kapitalrücklagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.eigenkapital?.kapitalruecklagen)), { align: 'right' })
      doc.text(`   III. Gewinnrücklagen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.eigenkapital?.gewinnruecklagen)), { align: 'right' })
      doc.text(`   IV. Gewinnvortrag`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.eigenkapital?.gewinnvortrag)), { align: 'right' })
      doc.text(`   V. Jahresüberschuss`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.eigenkapital?.jahresueberschuss)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('B. RÜCKSTELLUNGEN')
      doc.fontSize(10)
      doc.text(`   I. Pensionsrückstellungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.rueckstellungen?.pensionsrueckstellungen)), { align: 'right' })
      doc.text(`   II. Steuerrückstellungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.rueckstellungen?.steuerrueckstellungen)), { align: 'right' })
      doc.text(`   III. Sonstige Rückstellungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.rueckstellungen?.sonstigeRueckstellungen)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('C. VERBINDLICHKEITEN')
      doc.fontSize(10)
      doc.text(`   I. Verbindlichkeiten Kreditinstitute`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.verbindlichkeiten?.verbindlichkeitenKreditinstitute)), { align: 'right' })
      doc.text(`   II. Erhaltene Anzahlungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.verbindlichkeiten?.erhalteneAnzahlungen)), { align: 'right' })
      doc.text(`   III. Verbindlichkeiten Lieferungen`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.verbindlichkeiten?.verbindlichkeitenLieferungen)), { align: 'right' })
      doc.text(`   IV. Sonstige Verbindlichkeiten`, 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.verbindlichkeiten?.sonstigeVerbindlichkeiten)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(11).text('D. RECHNUNGSABGRENZUNGSPOSTEN', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(liabilities.rechnungsabgrenzungsposten)), { align: 'right' })
      doc.moveDown()

      doc.fontSize(12).text('SUMME PASSIVA', 50, doc.y, { continued: true, underline: true })
      doc.text(formatEUR(toNumber(balanceSheet.totalLiabilities)), { align: 'right', underline: true })

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
        bufferPages: true,
        autoFirstPage: false
      })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Add page manually to control font initialization
      doc.addPage()
      
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
      doc.text(formatEUR(toNumber(revenue.umsatzerloese)), { align: 'right' })
      doc.text('2. Bestandsveränderungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(revenue.bestandsveraenderungen)), { align: 'right' })
      doc.text('3. Andere aktivierte Eigenleistungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(revenue.andereAktivierteEigenleistungen)), { align: 'right' })
      doc.text('4. Sonstige betriebliche Erträge', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(revenue.sonstigeBetrieblicheErtraege)), { align: 'right' })
      doc.moveDown()

      const totalRevenue = toNumber(revenue.umsatzerloese) + 
                          toNumber(revenue.bestandsveraenderungen) + 
                          toNumber(revenue.andereAktivierteEigenleistungen) + 
                          toNumber(revenue.sonstigeBetrieblicheErtraege)
      doc.fontSize(11).text('Summe Erträge', 50, doc.y, { continued: true })
      doc.text(formatEUR(totalRevenue), { align: 'right' })
      doc.moveDown(2)

      // AUFWENDUNGEN
      doc.fontSize(14).text('AUFWENDUNGEN', { underline: true })
      doc.moveDown()

      doc.fontSize(10)
      doc.text('5. Materialaufwand', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(expenses.materialaufwand)), { align: 'right' })
      doc.text('6. Personalaufwand', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(expenses.personalaufwand)), { align: 'right' })
      doc.text('7. Abschreibungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(expenses.abschreibungen)), { align: 'right' })
      doc.text('8. Sonstige betriebliche Aufwendungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(expenses.sonstigeBetrieblicheAufwendungen)), { align: 'right' })
      doc.text('9. Zinsen und ähnliche Aufwendungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(expenses.zinsenUndAehnlicheAufwendungen)), { align: 'right' })
      doc.text('10. Steuern', 50, doc.y, { continued: true })
      doc.text(formatEUR(toNumber(expenses.steuern)), { align: 'right' })
      doc.moveDown()

      const totalExpenses = toNumber(expenses.materialaufwand) + 
                           toNumber(expenses.personalaufwand) + 
                           toNumber(expenses.abschreibungen) + 
                           toNumber(expenses.sonstigeBetrieblicheAufwendungen) + 
                           toNumber(expenses.zinsenUndAehnlicheAufwendungen) + 
                           toNumber(expenses.steuern)
      doc.fontSize(11).text('Summe Aufwendungen', 50, doc.y, { continued: true })
      doc.text(formatEUR(totalExpenses), { align: 'right' })
      doc.moveDown(2)

      // JAHRESERGEBNIS
      const netIncome = toNumber(incomeStatement.netIncome)
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
function formatEUR(amount: number | null | undefined): string {
  // Handle null, undefined, NaN
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(0)
  }
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(amount))
}

// Helper function to safely convert to number
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

// Helper function to generate Journal PDF
async function generateJournalPDF(entries: any[], year: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 30, 
        size: 'A4',
        bufferPages: true,
        autoFirstPage: false,
        layout: 'landscape' // Querformat für bessere Tabellenansicht
      })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Add page manually to control font initialization
      doc.addPage()
      
      // Use built-in Courier font to avoid font loading issues
      doc.font('Courier')

      // Header
      doc.fontSize(16).text('BUCHUNGSJOURNAL', { align: 'center' })
      doc.fontSize(10).text(`Geschäftsjahr ${year}`, { align: 'center' })
      doc.moveDown()
      doc.fontSize(8).text('Bereifung24 GmbH', { align: 'center' })
      doc.moveDown(1.5)

      // Table headers
      const startY = doc.y
      const colWidths = {
        nr: 40,
        datum: 65,
        konto: 110,
        gegenkonto: 110,
        beschreibung: 200,
        betrag: 70,
        belegnr: 60
      }
      
      let x = 30
      doc.fontSize(7)
      doc.text('Nr', x, startY, { width: colWidths.nr, align: 'left' })
      x += colWidths.nr
      doc.text('Datum', x, startY, { width: colWidths.datum, align: 'left' })
      x += colWidths.datum
      doc.text('Sollkonto', x, startY, { width: colWidths.konto, align: 'left' })
      x += colWidths.konto
      doc.text('Habenkonto', x, startY, { width: colWidths.gegenkonto, align: 'left' })
      x += colWidths.gegenkonto
      doc.text('Beschreibung', x, startY, { width: colWidths.beschreibung, align: 'left' })
      x += colWidths.beschreibung
      doc.text('Betrag', x, startY, { width: colWidths.betrag, align: 'right' })
      x += colWidths.betrag
      doc.text('Beleg', x, startY, { width: colWidths.belegnr, align: 'left' })

      // Line under headers
      doc.moveTo(30, doc.y + 2).lineTo(820, doc.y + 2).stroke()
      doc.moveDown(0.5)

      // Entries
      doc.fontSize(6)
      let totalAmount = 0

      for (const entry of entries) {
        // Check if we need a new page
        if (doc.y > 550) {
          doc.addPage()
          doc.font('Courier').fontSize(6)
        }

        x = 30
        const rowY = doc.y
        const amount = toNumber(entry.amount)
        totalAmount += amount

        // Entry number
        doc.text(entry.entryNumber || '-', x, rowY, { width: colWidths.nr, align: 'left' })
        x += colWidths.nr

        // Date
        const date = new Date(entry.bookingDate)
        doc.text(date.toLocaleDateString('de-DE'), x, rowY, { width: colWidths.datum, align: 'left' })
        x += colWidths.datum

        // Debit account
        doc.text(entry.debitAccount || '-', x, rowY, { width: colWidths.konto, align: 'left' })
        x += colWidths.konto

        // Credit account
        doc.text(entry.creditAccount || '-', x, rowY, { width: colWidths.gegenkonto, align: 'left' })
        x += colWidths.gegenkonto

        // Description (truncate if too long)
        const description = (entry.description || '-').substring(0, 50)
        doc.text(description, x, rowY, { width: colWidths.beschreibung, align: 'left' })
        x += colWidths.beschreibung

        // Amount
        doc.text(formatEUR(amount), x, rowY, { width: colWidths.betrag, align: 'right' })
        x += colWidths.betrag

        // Document number
        doc.text(entry.documentNumber || '-', x, rowY, { width: colWidths.belegnr, align: 'left' })

        doc.moveDown(0.7)
      }

      // Total line
      doc.moveDown(0.5)
      doc.moveTo(30, doc.y).lineTo(820, doc.y).stroke()
      doc.moveDown(0.5)
      
      doc.fontSize(8)
      const totalY = doc.y
      // Label für Summe (linksbündig im Beschreibungsbereich)
      doc.text(`Summe (${entries.length} Buchungen)`, 30 + colWidths.nr + colWidths.datum + colWidths.konto + colWidths.gegenkonto, totalY, { 
        width: colWidths.beschreibung, 
        align: 'right' 
      })
      // Betrag (rechtsbündig im Betrags-Bereich)
      doc.text(formatEUR(totalAmount), 30 + colWidths.nr + colWidths.datum + colWidths.konto + colWidths.gegenkonto + colWidths.beschreibung, totalY, { 
        width: colWidths.betrag, 
        align: 'right' 
      })

      // Footer
      doc.fontSize(6)
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`, 30, 570, { align: 'center' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// ============================================
// EXCEL GENERATORS
// ============================================

async function generateBalanceSheetExcel(balanceSheet: any, year: number): Promise<Buffer> {
  const wb = XLSX.utils.book_new()
  
  // Aktiva Sheet
  const aktivaData = [
    ['BILANZ - AKTIVA'],
    [`Geschäftsjahr ${year}`],
    ['Bereifung24 GmbH'],
    [],
    ['A. ANLAGEVERMÖGEN', ''],
    ['  I. Immaterielle Vermögensgegenstände', formatEUR(toNumber(balanceSheet.assets.anlagevermoegen.immaterielleVermoegensgegenstaende))],
    ['  II. Sachanlagen', formatEUR(toNumber(balanceSheet.assets.anlagevermoegen.sachanlagen))],
    ['  III. Finanzanlagen', formatEUR(toNumber(balanceSheet.assets.anlagevermoegen.finanzanlagen))],
    [],
    ['B. UMLAUFVERMÖGEN', ''],
    ['  I. Vorräte', formatEUR(toNumber(balanceSheet.assets.umlaufvermoegen.vorraete))],
    ['  II. Forderungen', formatEUR(toNumber(balanceSheet.assets.umlaufvermoegen.forderungen))],
    ['  III. Kasse, Bank', formatEUR(toNumber(balanceSheet.assets.umlaufvermoegen.kasseBank))],
    [],
    ['C. RECHNUNGSABGRENZUNGSPOSTEN', formatEUR(toNumber(balanceSheet.assets.rechnungsabgrenzungsposten))],
    [],
    ['SUMME AKTIVA', formatEUR(toNumber(balanceSheet.totalAssets))]
  ]
  const wsAktiva = XLSX.utils.aoa_to_sheet(aktivaData)
  wsAktiva['!cols'] = [{ wch: 50 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsAktiva, 'Aktiva')

  // Passiva Sheet  
  const passivaData = [
    ['BILANZ - PASSIVA'],
    [`Geschäftsjahr ${year}`],
    ['Bereifung24 GmbH'],
    [],
    ['A. EIGENKAPITAL', ''],
    ['  I. Gezeichnetes Kapital', formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.gezeichnetesKapital))],
    ['  II. Kapitalrücklage', formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.kapitalruecklagen))],
    ['  III. Gewinnrücklagen', formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.gewinnruecklagen))],
    ['  IV. Gewinnvortrag/Verlustvortrag', formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.gewinnvortrag))],
    ['  V. Jahresüberschuss', formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.jahresueberschuss))],
    [],
    ['B. RÜCKSTELLUNGEN', ''],
    ['  1. Pensionsrückstellungen', formatEUR(toNumber(balanceSheet.liabilities.rueckstellungen.pensionsrueckstellungen))],
    ['  2. Steuerrückstellungen', formatEUR(toNumber(balanceSheet.liabilities.rueckstellungen.steuerrueckstellungen))],
    ['  3. Sonstige Rückstellungen', formatEUR(toNumber(balanceSheet.liabilities.rueckstellungen.sonstigeRueckstellungen))],
    [],
    ['C. VERBINDLICHKEITEN', ''],
    ['  1. Verbindlichkeiten Kreditinstitute', formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.verbindlichkeitenKreditinstitute))],
    ['  2. Erhaltene Anzahlungen', formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.erhalteneAnzahlungen))],
    ['  3. Verbindlichkeiten Lieferungen', formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.verbindlichkeitenLieferungen))],
    ['  4. Sonstige Verbindlichkeiten', formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.sonstigeVerbindlichkeiten))],
    [],
    ['D. RECHNUNGSABGRENZUNGSPOSTEN', formatEUR(toNumber(balanceSheet.liabilities.rechnungsabgrenzungsposten))],
    [],
    ['SUMME PASSIVA', formatEUR(toNumber(balanceSheet.totalLiabilities))]
  ]
  const wsPassiva = XLSX.utils.aoa_to_sheet(passivaData)
  wsPassiva['!cols'] = [{ wch: 50 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsPassiva, 'Passiva')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

async function generateIncomeStatementExcel(incomeStatement: any, year: number): Promise<Buffer> {
  const wb = XLSX.utils.book_new()
  
  const data = [
    ['GEWINN- UND VERLUSTRECHNUNG'],
    [`Geschäftsjahr ${year}`],
    ['Bereifung24 GmbH'],
    [],
    ['ERTRÄGE', ''],
    ['Umsatzerlöse', formatEUR(toNumber(incomeStatement.revenue.umsatzerloese))],
    ['Bestandsveränderungen', formatEUR(toNumber(incomeStatement.revenue.bestandsveraenderungen))],
    ['Andere aktivierte Eigenleistungen', formatEUR(toNumber(incomeStatement.revenue.andereAktivierteEigenleistungen))],
    ['Sonstige betriebliche Erträge', formatEUR(toNumber(incomeStatement.revenue.sonstigeBetrieblicheErtraege))],
    ['Summe Erträge', formatEUR(toNumber(incomeStatement.totalRevenue))],
    [],
    ['AUFWENDUNGEN', ''],
    ['Materialaufwand', formatEUR(toNumber(incomeStatement.expenses.materialaufwand))],
    ['Personalaufwand', formatEUR(toNumber(incomeStatement.expenses.personalaufwand))],
    ['Abschreibungen', formatEUR(toNumber(incomeStatement.expenses.abschreibungen))],
    ['Sonstige betriebliche Aufwendungen', formatEUR(toNumber(incomeStatement.expenses.sonstigeBetrieblicheAufwendungen))],
    ['Zinsen und ähnliche Aufwendungen', formatEUR(toNumber(incomeStatement.expenses.zinsenUndAehnlicheAufwendungen))],
    ['Steuern', formatEUR(toNumber(incomeStatement.expenses.steuern))],
    ['Summe Aufwendungen', formatEUR(toNumber(incomeStatement.totalExpenses))],
    [],
    ['JAHRESÜBERSCHUSS/-FEHLBETRAG', formatEUR(toNumber(incomeStatement.netIncome))]
  ]
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 50 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, 'GuV')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

async function generateJournalExcel(entries: any[], year: number): Promise<Buffer> {
  const wb = XLSX.utils.book_new()
  
  const data: any[][] = [
    ['BUCHUNGSJOURNAL'],
    [`Geschäftsjahr ${year}`],
    ['Bereifung24 GmbH'],
    [],
    ['Nr', 'Datum', 'Sollkonto', 'Habenkonto', 'Beschreibung', 'Betrag', 'Beleg']
  ]

  let totalAmount = 0
  
  entries.forEach(entry => {
    const amount = toNumber(entry.amount)
    totalAmount += amount
    data.push([
      entry.entryNumber || '-',
      new Date(entry.bookingDate).toLocaleDateString('de-DE'),
      entry.debitAccount || '-',
      entry.creditAccount || '-',
      entry.description || '-',
      formatEUR(amount),
      entry.documentNumber || '-'
    ])
  })

  data.push([])
  data.push(['', '', '', '', `Summe (${entries.length} Buchungen)`, formatEUR(totalAmount), ''])
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Journal')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

// ============================================
// CSV GENERATORS
// ============================================

function generateBalanceSheetCSV(balanceSheet: any, year: number): string {
  const lines: string[] = []
  
  // Add UTF-8 BOM for Excel compatibility
  lines.push('\uFEFF"BILANZ - AKTIVA"')
  lines.push(`"Geschäftsjahr ${year}"`)
  lines.push(`"Bereifung24 GmbH"`)
  lines.push('')
  
  // Aktiva
  lines.push(`"A. ANLAGEVERMÖGEN","Betrag"`)
  lines.push(`"  I. Immaterielle Vermögensgegenstände","${formatEUR(toNumber(balanceSheet.assets.anlagevermoegen.immaterielleVermoegensgegenstaende))}"`)
  lines.push(`"  II. Sachanlagen","${formatEUR(toNumber(balanceSheet.assets.anlagevermoegen.sachanlagen))}"`)
  lines.push(`"  III. Finanzanlagen","${formatEUR(toNumber(balanceSheet.assets.anlagevermoegen.finanzanlagen))}"`)
  lines.push('')
  lines.push(`"B. UMLAUFVERMÖGEN"`)
  lines.push(`"  I. Vorräte","${formatEUR(toNumber(balanceSheet.assets.umlaufvermoegen.vorraete))}"`)
  lines.push(`"  II. Forderungen","${formatEUR(toNumber(balanceSheet.assets.umlaufvermoegen.forderungen))}"`)
  lines.push(`"  III. Kasse, Bank","${formatEUR(toNumber(balanceSheet.assets.umlaufvermoegen.kasseBank))}"`)
  lines.push('')
  lines.push(`"C. RECHNUNGSABGRENZUNGSPOSTEN","${formatEUR(toNumber(balanceSheet.assets.rechnungsabgrenzungsposten))}"`)
  lines.push('')
  lines.push(`"SUMME AKTIVA","${formatEUR(toNumber(balanceSheet.totalAssets))}"`)
  lines.push('')
  lines.push('')
  
  // Passiva
  lines.push(`"BILANZ - PASSIVA"`)
  lines.push(`"Geschäftsjahr ${year}"`)
  lines.push('')
  lines.push(`"A. EIGENKAPITAL","Betrag"`)
  lines.push(`"  I. Gezeichnetes Kapital","${formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.gezeichnetesKapital))}"`)
  lines.push(`"  II. Kapitalrücklage","${formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.kapitalruecklagen))}"`)
  lines.push(`"  III. Gewinnrücklagen","${formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.gewinnruecklagen))}"`)
  lines.push(`"  IV. Gewinnvortrag","${formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.gewinnvortrag))}"`)
  lines.push(`"  V. Jahresüberschuss","${formatEUR(toNumber(balanceSheet.liabilities.eigenkapital.jahresueberschuss))}"`)
  lines.push('')
  lines.push(`"B. RÜCKSTELLUNGEN"`)
  lines.push(`"  1. Pensionsrückstellungen","${formatEUR(toNumber(balanceSheet.liabilities.rueckstellungen.pensionsrueckstellungen))}"`)
  lines.push(`"  2. Steuerrückstellungen","${formatEUR(toNumber(balanceSheet.liabilities.rueckstellungen.steuerrueckstellungen))}"`)
  lines.push(`"  3. Sonstige Rückstellungen","${formatEUR(toNumber(balanceSheet.liabilities.rueckstellungen.sonstigeRueckstellungen))}"`)
  lines.push('')
  lines.push(`"C. VERBINDLICHKEITEN"`)
  lines.push(`"  1. Verbindlichkeiten Kreditinstitute","${formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.verbindlichkeitenKreditinstitute))}"`)
  lines.push(`"  2. Erhaltene Anzahlungen","${formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.erhalteneAnzahlungen))}"`)
  lines.push(`"  3. Verbindlichkeiten Lieferungen","${formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.verbindlichkeitenLieferungen))}"`)
  lines.push(`"  4. Sonstige Verbindlichkeiten","${formatEUR(toNumber(balanceSheet.liabilities.verbindlichkeiten.sonstigeVerbindlichkeiten))}"`)
  lines.push('')
  lines.push(`"D. RECHNUNGSABGRENZUNGSPOSTEN","${formatEUR(toNumber(balanceSheet.liabilities.rechnungsabgrenzungsposten))}"`)
  lines.push('')
  lines.push(`"SUMME PASSIVA","${formatEUR(toNumber(balanceSheet.totalLiabilities))}"`)
  
  return lines.join('\n')
}

function generateIncomeStatementCSV(incomeStatement: any, year: number): string {
  const lines: string[] = []
  
  // Add UTF-8 BOM for Excel compatibility
  lines.push('\uFEFF"GEWINN- UND VERLUSTRECHNUNG"')
  lines.push(`"Geschäftsjahr ${year}"`)
  lines.push(`"Bereifung24 GmbH"`)
  lines.push('')
  lines.push(`"Position","Betrag"`)
  lines.push(`"ERTRÄGE"`)
  lines.push(`"Umsatzerlöse","${formatEUR(toNumber(incomeStatement.revenue.umsatzerloese))}"`)
  lines.push(`"Bestandsveränderungen","${formatEUR(toNumber(incomeStatement.revenue.bestandsveraenderungen))}"`)
  lines.push(`"Andere aktivierte Eigenleistungen","${formatEUR(toNumber(incomeStatement.revenue.andereAktivierteEigenleistungen))}"`)
  lines.push(`"Sonstige betriebliche Erträge","${formatEUR(toNumber(incomeStatement.revenue.sonstigeBetrieblicheErtraege))}"`)
  lines.push(`"Summe Erträge","${formatEUR(toNumber(incomeStatement.totalRevenue))}"`)
  lines.push('')
  lines.push(`"AUFWENDUNGEN"`)
  lines.push(`"Materialaufwand","${formatEUR(toNumber(incomeStatement.expenses.materialaufwand))}"`)
  lines.push(`"Personalaufwand","${formatEUR(toNumber(incomeStatement.expenses.personalaufwand))}"`)
  lines.push(`"Abschreibungen","${formatEUR(toNumber(incomeStatement.expenses.abschreibungen))}"`)
  lines.push(`"Sonstige betriebliche Aufwendungen","${formatEUR(toNumber(incomeStatement.expenses.sonstigeBetrieblicheAufwendungen))}"`)
  lines.push(`"Zinsen und ähnliche Aufwendungen","${formatEUR(toNumber(incomeStatement.expenses.zinsenUndAehnlicheAufwendungen))}"`)
  lines.push(`"Steuern","${formatEUR(toNumber(incomeStatement.expenses.steuern))}"`)
  lines.push(`"Summe Aufwendungen","${formatEUR(toNumber(incomeStatement.totalExpenses))}"`)
  lines.push('')
  lines.push(`"JAHRESÜBERSCHUSS/-FEHLBETRAG","${formatEUR(toNumber(incomeStatement.netIncome))}"`)
  
  return lines.join('\n')
}

function generateJournalCSV(entries: any[], year: number): string {
  const lines: string[] = []
  
  // Add UTF-8 BOM for Excel compatibility
  lines.push('\uFEFF"BUCHUNGSJOURNAL"')
  lines.push(`"Geschäftsjahr ${year}"`)
  lines.push(`"Bereifung24 GmbH"`)
  lines.push('')
  lines.push(`"Nr","Datum","Sollkonto","Habenkonto","Beschreibung","Betrag","Beleg"`)
  
  let totalAmount = 0
  
  entries.forEach(entry => {
    const amount = toNumber(entry.amount)
    totalAmount += amount
    const date = new Date(entry.bookingDate).toLocaleDateString('de-DE')
    const desc = (entry.description || '').replace(/"/g, '""') // Escape quotes
    lines.push(`"${entry.entryNumber || '-'}","${date}","${entry.debitAccount || '-'}","${entry.creditAccount || '-'}","${desc}","${formatEUR(amount)}","${entry.documentNumber || '-'}"`)
  })
  
  lines.push('')
  lines.push(`"","","","","Summe (${entries.length} Buchungen)","${formatEUR(totalAmount)}",""`)
  
  return lines.join('\n')
}
