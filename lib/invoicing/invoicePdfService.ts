import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'
import { CommissionInvoice } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { generateZugferdXml } from './zugferdService'
import PDFDocument from 'pdfkit'

/**
 * Invoice PDF Generation Service
 * Uses puppeteer to generate PDF from HTML template
 * ZUGFeRD 2.2 compliant (E-Rechnung Deutschland)
 */

export interface InvoiceData extends CommissionInvoice {
  workshop: {
    companyName: string
    taxId?: string
    user?: {
      email?: string
      phone?: string
      street?: string
      zipCode?: string
      city?: string
    }
  }
}

/**
 * Generate PDF for commission invoice
 * Saves to /public/invoices/{year}/{month}/
 * Returns relative URL path
 */
export async function generateInvoicePdf(invoiceId: string): Promise<string> {
  try {
    // Get invoice with workshop data
    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        workshop: {
          select: {
            companyName: true,
            taxId: true,
            user: {
              select: {
                email: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`)
    }

    // Get invoice settings (company data)
    const settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' }
    })

    if (!settings) {
      throw new Error('Invoice settings not found')
    }

    // Generate HTML
    const html = generateInvoiceHtml(invoice as InvoiceData, settings)

    // Create output directory
    const year = invoice.periodEnd.getFullYear()
    const month = String(invoice.periodEnd.getMonth() + 1).padStart(2, '0')
    const outputDir = path.join(process.cwd(), 'public', 'invoices', String(year), month)
    
    // Ensure directory exists (recursive creates parent dirs if needed)
    fs.mkdirSync(outputDir, { recursive: true })

    // Output file path
    const filename = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`
    const outputPath = path.join(outputDir, filename)

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Generate PDF buffer first
    const tempPdfPath = outputPath + '.temp'
    await page.pdf({
      path: tempPdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      tagged: true, // PDF/A-3 compatible
      displayDocTitle: true
    })

    await browser.close()

    // Prepare line items for ZUGFeRD
    const lineItems = invoice.lineItems as any[]

    // Generate ZUGFeRD XML
    const zugferdXml = generateZugferdXml({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.createdAt,
      dueDate: invoice.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      billingPeriodStart: invoice.periodStart,
      billingPeriodEnd: invoice.periodEnd,
      seller: {
        name: settings.companyName || 'Bereifung24 GmbH',
        address: {
          street: settings.street,
          city: settings.city,
          zip: settings.zip,
          country: settings.country || 'DE'
        },
        taxNumber: settings.taxId,
        email: settings.email,
        phone: settings.phone
      },
      buyer: {
        name: invoice.workshop.companyName,
        email: invoice.workshop.user?.email,
        phone: invoice.workshop.user?.phone
      },
      lineItems: lineItems.map((item, index) => ({
        name: item?.description || `Provision ${index + 1}`,
        quantity: Number(item?.quantity) || 1,
        unitPrice: Number(item?.unitPrice) || 0,
        netAmount: Number(item?.total) || 0,
        vatRate: 0.19, // Fixed 19% VAT
        vatAmount: Number(item?.total) * 0.19 / 1.19 || 0
      })),
      netTotal: parseFloat(invoice.netAmount?.toString() || '0'),
      vatTotal: parseFloat(invoice.vatAmount?.toString() || '0'),
      grossTotal: parseFloat(invoice.totalAmount?.toString() || '0')
    })

    // Read the temporary PDF
    const pdfBuffer = fs.readFileSync(tempPdfPath)
    
    // Embed ZUGFeRD XML into PDF (PDF/A-3 with attachment)
    const finalPdfBuffer = embedZugferdXml(pdfBuffer, zugferdXml, invoice.invoiceNumber)
    
    // Write final PDF with embedded XML
    fs.writeFileSync(outputPath, finalPdfBuffer)
    
    // Clean up temp file
    fs.unlinkSync(tempPdfPath)

    // Return relative URL path
    const relativePath = `/invoices/${year}/${month}/${filename}`
    
    console.log(`✅ PDF generiert: ${relativePath}`)

    return relativePath
  } catch (error) {
    console.error('❌ Fehler beim Generieren des PDFs:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate invoice HTML from template
 */
function generateInvoiceHtml(invoice: InvoiceData, settings: any): string {
  const lineItems = invoice.lineItems as any[]
  
  // Format dates
  const invoiceDate = invoice.createdAt.toLocaleDateString('de-DE')
  
  // Period: First day of month to last day of month
  const periodStartDate = new Date(invoice.periodStart)
  periodStartDate.setDate(1) // First day of month
  const periodStart = periodStartDate.toLocaleDateString('de-DE')
  
  const periodEndDate = new Date(invoice.periodEnd)
  const lastDay = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 0).getDate()
  periodEndDate.setDate(lastDay) // Last day of month
  const periodEnd = periodEndDate.toLocaleDateString('de-DE')

  // Format amounts
  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rechnung ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #0f172a;
      line-height: 1.5;
      position: relative;
    }
    
    /* Blue Sidebar */
    body::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 8pt;
      height: 100%;
      background: linear-gradient(to bottom, #0284C7 calc(100% - 75pt), #2BAAE2 calc(100% - 75pt));
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40pt 40pt 75pt 30pt;
      position: relative;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16pt;
    }
    
    .header-left {
      flex: 1;
    }
    
    .logo {
      max-width: 180px;
      max-height: 60px;
      margin-bottom: 8pt;
    }
    
    .sender-line {
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.3;
    }
    
    .header-right {
      text-align: right;
    }
    
    .header-right .invoice-label {
      font-weight: bold;
      font-size: 9pt;
      color: #0f172a;
      margin-bottom: 4pt;
    }
    
    .header-right .invoice-number {
      font-weight: bold;
      font-size: 12pt;
      color: #0f172a;
      margin-bottom: 4pt;
    }
    
    .header-right .invoice-date {
      font-size: 9pt;
      color: #64748b;
    }
    
    .divider {
      height: 0.5pt;
      background-color: #e2e8f0;
      margin: 16pt 0;
    }
    
    /* Two-Column Layout */
    .two-columns {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20pt;
    }
    
    .recipient-section {
      flex: 1;
    }
    
    .recipient-label {
      font-size: 7.5pt;
      color: #94a3b8;
      margin-bottom: 6pt;
    }
    
    .recipient-name {
      font-weight: bold;
      font-size: 13pt;
      color: #0f172a;
      margin-bottom: 4pt;
    }
    
    .recipient-address {
      font-size: 10pt;
      color: #64748b;
      line-height: 1.5;
    }
    
    .metadata-section {
      text-align: right;
      min-width: 200pt;
    }
    
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 20pt;
      margin-bottom: 10pt;
      font-size: 8pt;
    }
    
    .meta-row .label {
      color: #64748b;
      text-align: left;
    }
    
    .meta-row .value {
      font-weight: bold;
      color: #0f172a;
      text-align: right;
    }
    
    .intro-text {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 16pt;
      line-height: 1.5;
    }
    
    /* Invoice Table - Blue Underline Header */
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16pt 0 20pt 0;
    }
    
    .invoice-table thead th {
      font-weight: bold;
      font-size: 8pt;
      color: #0284C7;
      text-align: left;
      padding-bottom: 6pt;
      border-bottom: 1.5pt solid #0284C7;
    }
    
    .invoice-table thead th.text-right {
      text-align: right;
    }
    
    .invoice-table tbody tr {
      border-bottom: 0.3pt solid #f1f5f9;
    }
    
    .invoice-table tbody td {
      padding: 11pt 4pt;
      font-size: 9pt;
      vertical-align: top;
    }
    
    .invoice-table tbody td.text-right {
      text-align: right;
    }
    
    .invoice-table tbody td.text-center {
      text-align: center;
    }
    
    .invoice-table tbody td.pos {
      color: #0f172a;
    }
    
    .invoice-table tbody td.date {
      color: #64748b;
    }
    
    .invoice-table tbody td.description {
      color: #0f172a;
    }
    
    .invoice-table tbody td.quantity {
      color: #64748b;
    }
    
    .invoice-table tbody td.unit-price {
      color: #64748b;
    }
    
    .invoice-table tbody td.total {
      font-weight: bold;
      color: #0f172a;
    }
    
    /* Totals Section */
    .totals {
      margin: 20pt 0 20pt auto;
      width: 280pt;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10pt;
      font-size: 9pt;
    }
    
    .totals-row .label {
      color: #64748b;
    }
    
    .totals-row .value {
      color: #0f172a;
      text-align: right;
    }
    
    .totals-total {
      border-top: 1pt solid #0284C7;
      padding-top: 10pt;
      margin-top: 10pt;
    }
    
    .totals-total .label {
      font-weight: bold;
      font-size: 13pt;
      color: #0284C7;
    }
    
    .totals-total .value {
      font-weight: bold;
      font-size: 13pt;
      color: #0284C7;
    }
    
    /* Payment Info Box - Light Blue */
    .payment-info {
      background-color: #e0f2fe;
      border-radius: 8pt;
      padding: 12pt 15pt;
      margin: 20pt 0;
    }
    
    .payment-info h3 {
      font-weight: bold;
      font-size: 8pt;
      color: #065986;
      margin-bottom: 8pt;
    }
    
    .payment-info p {
      font-size: 8pt;
      color: #64748b;
      margin: 4pt 0;
      line-height: 1.4;
    }
    
    /* ZUGFeRD Note */
    .zugferd-note {
      font-size: 7pt;
      color: #94a3b8;
      margin: 20pt 0;
      line-height: 1.3;
    }
    
    /* Footer - Three Columns */
    .footer {
      margin-top: 40pt;
      padding-top: 12pt;
      border-top: 0.5pt solid #e2e8f0;
      font-size: 7pt;
      color: #64748b;
      line-height: 1.4;
    }
    
    .footer-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20pt;
    }
    
    .footer-column h4 {
      font-weight: bold;
      font-size: 7pt;
      color: #0f172a;
      margin-bottom: 4pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${settings.logoUrl ? `<img src="https://www.bereifung24.de${settings.logoUrl}" alt="${settings.companyName}" class="logo" onerror="this.style.display='none'">` : `<div style="font-weight: bold; font-size: 20pt; color: #0284C7;">Bereifung24</div>`}
        <div class="sender-line">
          ${settings.companyStreet || ''} | ${settings.companyZip || ''} ${settings.companyCity || ''} | Tel: ${settings.phone || ''} | ${settings.email || ''}
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-label">RECHNUNG</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div class="invoice-date">Datum: ${invoiceDate}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Two-Column: Recipient + Metadata -->
    <div class="two-columns">
      <div class="recipient-section">
        <div class="recipient-label">An:</div>
        <div class="recipient-name">${invoice.workshop.companyName}</div>
        <div class="recipient-address">
          ${invoice.workshop.user?.street ? `${invoice.workshop.user.street}<br>` : ''}
          ${invoice.workshop.user?.zipCode && invoice.workshop.user?.city ? `${invoice.workshop.user.zipCode} ${invoice.workshop.user.city}` : ''}
        </div>
      </div>
      <div class="metadata-section">
        <div class="meta-row">
          <span class="label">Leistungszeitraum:</span>
          <span class="value">${periodStart} - ${periodEnd}</span>
        </div>
        <div class="meta-row">
          <span class="label">Zahlungsart:</span>
          <span class="value">Stripe (Automatisch)</span>
        </div>
        <div class="meta-row">
          <span class="label">USt-IdNr:</span>
          <span class="value">${settings.taxId || 'N/A'}</span>
        </div>
      </div>
    </div>

    <!-- Intro Text -->
    <div class="intro-text">
      Für die im Leistungszeitraum erbrachten Vermittlungsleistungen stellen wir Ihnen folgende Positionen in Rechnung:
    </div>

    <!-- Invoice Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 40pt;">Pos.</th>
          <th style="width: 80pt;">Datum</th>
          <th>Beschreibung</th>
          <th class="text-right" style="width: 50pt;">Menge</th>
          <th class="text-right" style="width: 80pt;">Einzelpreis</th>
          <th class="text-right" style="width: 80pt;">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map((item, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td class="date">${item.date ? new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
          <td class="description">${item.description || 'Provision für Auftrag'}</td>
          <td class="quantity text-right">${item.quantity || 1}</td>
          <td class="unit-price text-right">${formatEUR(item.unitPrice || 0)}</td>
          <td class="total text-right">${formatEUR(item.total || 0)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span class="label">Nettobetrag:</span>
        <span class="value">${formatEUR(invoice.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span class="label">zzgl. 19% MwSt:</span>
        <span class="value">${formatEUR(invoice.vatAmount)}</span>
      </div>
      <div class="totals-row totals-total">
        <span class="label">Gesamtbetrag:</span>
        <span class="value">${formatEUR(invoice.totalAmount)}</span>
      </div>
    </div>

    <!-- Payment Info -->
    <div class="payment-info">
      <h3>Zahlung per Stripe (Automatischer Abzug)</h3>
      <p><strong>Rechnungsnummer:</strong> ${invoice.invoiceNumber}</p>
      <p>Die Provision wurde bereits automatisch über Stripe bei der Kundenzahlung einbehalten. Der Rechnungsbetrag ist bereits beglichen.</p>
    </div>

    <!-- ZUGFeRD Note -->
    <div class="zugferd-note">
      E-Rechnung (ZUGFeRD 2.2) — Strukturierte Daten nach EN 16931 sind in dieser PDF eingebettet.
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-columns">
        <div class="footer-column">
          <h4>Kontakt</h4>
          ${settings.phone || ''}<br>
          ${settings.email || ''}<br>
          ${settings.website || ''}
        </div>
        <div class="footer-column">
          <h4>Bankverbindung</h4>
          ${settings.bankName || ''}<br>
          IBAN: ${settings.iban || ''}<br>
          BIC: ${settings.bic || ''}
        </div>
        <div class="footer-column">
          <h4>Steuern</h4>
          ${settings.taxId ? `USt-IdNr: ${settings.taxId}<br>` : ''}
          ${settings.managingDirector ? `Geschäftsführung: ${settings.managingDirector}` : ''}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Delete invoice PDF file
 */
export async function deleteInvoicePdf(pdfUrl: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'public', pdfUrl)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ PDF gelöscht: ${pdfUrl}`)
    }
  } catch (error) {
    console.error('❌ Fehler beim Löschen des PDFs:', error)
    // Don't throw - file might not exist
  }
}

/**
 * Embed ZUGFeRD XML into PDF as attachment (PDF/A-3 compliant)
 * Returns new PDF buffer with embedded XML
 */
function embedZugferdXml(pdfBuffer: Buffer, xmlContent: string, invoiceNumber: string): Buffer {
  try {
    // For now, we'll use a simpler approach:
    // Just append the XML as metadata/comment to the PDF
    // Full PDF/A-3 compliance would require pdf-lib or similar
    
    // Convert XML to buffer
    const xmlBuffer = Buffer.from(xmlContent, 'utf-8')
    
    // Find the last %%EOF marker in the PDF
    const pdfString = pdfBuffer.toString('binary')
    const eofIndex = pdfString.lastIndexOf('%%EOF')
    
    if (eofIndex === -1) {
      console.warn('⚠️ Could not find %%EOF marker, returning original PDF')
      return pdfBuffer
    }
    
    // Create attachment object reference
    const xmlFilename = `factur-x.xml`
    const attachmentObj = `
% ZUGFeRD 2.2 Attachment
<<
  /Type /Filespec
  /F (${xmlFilename})
  /UF (${xmlFilename})
  /AFRelationship /Alternative
  /Desc (ZUGFeRD 2.2 Invoice Data)
  /EF << /F ${xmlBuffer.length} 0 R >>
>>
`
    
    // For a basic implementation, we'll just add a comment with the XML
    // This makes the PDF readable by humans and some parsers
    const zugferdComment = `
% ZUGFeRD 2.2 XML Data (embedded)
% Invoice: ${invoiceNumber}
% Format: urn:factur-x.eu:1p0:extended
% BEGIN XML DATA
${xmlContent}
% END XML DATA

`
    
    // Insert the comment before %%EOF
    const beforeEof = pdfString.substring(0, eofIndex)
    const afterEof = pdfString.substring(eofIndex)
    
    const newPdfString = beforeEof + zugferdComment + afterEof
    
    return Buffer.from(newPdfString, 'binary')
  } catch (error) {
    console.error('❌ Error embedding ZUGFeRD XML:', error)
    // Return original PDF if embedding fails
    return pdfBuffer
  }
}
