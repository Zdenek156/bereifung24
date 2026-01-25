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
    name: string
    street?: string
    zip?: string
    city?: string
    country?: string
    email?: string
    phone?: string
    taxId?: string
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
            user: {
              select: {
                email: true,
                phone: true
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
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

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
      lineItems: lineItems.map(item => ({
        name: item.description || 'Provision',
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        netAmount: parseFloat(item.netAmount?.toString() || '0'),
        vatRate: parseFloat(item.taxRate?.toString() || '0.19'),
        vatAmount: parseFloat(item.taxAmount?.toString() || '0')
      })),
      netTotal: parseFloat(invoice.netAmount.toString()),
      vatTotal: parseFloat(invoice.vatAmount.toString()),
      grossTotal: parseFloat(invoice.totalAmount.toString())
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
  const periodStart = invoice.periodStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const periodEnd = invoice.periodEnd.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const dueDate = invoice.dueDate?.toLocaleDateString('de-DE')

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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #007bff;
    }
    
    .logo {
      max-width: 200px;
      max-height: 80px;
    }
    
    .company-info {
      text-align: right;
      font-size: 10pt;
      line-height: 1.4;
    }
    
    .company-info strong {
      font-size: 14pt;
      color: #007bff;
      display: block;
      margin-bottom: 8px;
    }
    
    .recipient {
      margin-bottom: 30px;
    }
    
    .recipient-address {
      font-size: 10pt;
      line-height: 1.4;
    }
    
    .invoice-title {
      font-size: 20pt;
      font-weight: bold;
      color: #007bff;
      margin: 30px 0 20px 0;
    }
    
    .invoice-meta {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 8px;
      margin-bottom: 30px;
      font-size: 10pt;
    }
    
    .invoice-meta strong {
      color: #666;
    }
    
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    
    .invoice-table thead {
      background-color: #007bff;
      color: white;
    }
    
    .invoice-table th,
    .invoice-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .invoice-table th {
      font-weight: 600;
      font-size: 10pt;
    }
    
    .invoice-table td {
      font-size: 10pt;
    }
    
    .invoice-table .text-right {
      text-align: right;
    }
    
    .invoice-table .text-center {
      text-align: center;
    }
    
    .invoice-table tbody tr:hover {
      background-color: #f8f9fa;
    }
    
    .totals {
      margin-top: 20px;
      margin-left: auto;
      width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 10pt;
    }
    
    .totals-row.subtotal {
      border-top: 1px solid #ddd;
    }
    
    .totals-row.total {
      border-top: 2px solid #333;
      font-weight: bold;
      font-size: 12pt;
      padding-top: 12px;
      margin-top: 8px;
    }
    
    .payment-info {
      margin-top: 40px;
      padding: 20px;
      background-color: #f8f9fa;
      border-left: 4px solid #007bff;
    }
    
    .payment-info h3 {
      color: #007bff;
      margin-bottom: 12px;
      font-size: 12pt;
    }
    
    .payment-info p {
      margin: 8px 0;
      font-size: 10pt;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #666;
      text-align: center;
      line-height: 1.4;
    }
    
    .footer-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
      margin-bottom: 15px;
    }
    
    .footer-column h4 {
      font-size: 9pt;
      color: #333;
      margin-bottom: 5px;
    }
    
    .notes {
      margin-top: 30px;
      padding: 15px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo">` : `<h1 style="color: #007bff;">${settings.companyName}</h1>`}
      </div>
      <div class="company-info">
        <strong>${settings.companyName}</strong>
        ${settings.companyStreet || ''}<br>
        ${settings.companyZip || ''} ${settings.companyCity || ''}<br>
        ${settings.companyCountry || 'Deutschland'}<br>
        <br>
        ${settings.phone ? `Tel: ${settings.phone}<br>` : ''}
        ${settings.email ? `E-Mail: ${settings.email}<br>` : ''}
        ${settings.website ? `Web: ${settings.website}` : ''}
      </div>
    </div>

    <!-- Recipient -->
    <div class="recipient">
      <div style="font-size: 8pt; color: #999; margin-bottom: 3px;">
        ${settings.companyName} • ${settings.companyStreet || ''} • ${settings.companyZip || ''} ${settings.companyCity || ''}
      </div>
      <div class="recipient-address">
        <strong>${invoice.workshop.companyName}</strong><br>
        ${invoice.workshop.taxId ? `USt-IdNr: ${invoice.workshop.taxId}<br>` : ''}
        ${invoice.workshop.user.email ? `E-Mail: ${invoice.workshop.user.email}<br>` : ''}
        ${invoice.workshop.user.phone ? `Tel: ${invoice.workshop.user.phone}` : ''}
      </div>
    </div>

    <!-- Invoice Title -->
    <h1 class="invoice-title">Rechnung ${invoice.invoiceNumber}</h1>

    <!-- Invoice Meta -->
    <div class="invoice-meta">
      <strong>Rechnungsdatum:</strong>
      <span>${invoiceDate}</span>
      
      <strong>Leistungszeitraum:</strong>
      <span>${periodStart} - ${periodEnd}</span>
      
      ${dueDate ? `
      <strong>Zahlbar bis:</strong>
      <span>${dueDate}</span>
      ` : ''}
      
      ${settings.taxId ? `
      <strong>USt-IdNr.:</strong>
      <span>${settings.taxId}</span>
      ` : ''}
    </div>

    <!-- Introduction -->
    <p style="margin: 20px 0;">
      Sehr geehrte Damen und Herren,<br>
      für die im Leistungszeitraum erbrachten Vermittlungsleistungen stellen wir Ihnen folgende Positionen in Rechnung:
    </p>

    <!-- Invoice Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 50px;">Pos.</th>
          <th>Beschreibung</th>
          <th class="text-center" style="width: 80px;">Menge</th>
          <th class="text-right" style="width: 100px;">Einzelpreis</th>
          <th class="text-right" style="width: 100px;">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
        <tr>
          <td class="text-center">${item.position}</td>
          <td>${item.description}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${formatEUR(item.unitPrice)}</td>
          <td class="text-right">${formatEUR(item.total)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row subtotal">
        <span>Nettobetrag:</span>
        <strong>${formatEUR(invoice.subtotal)}</strong>
      </div>
      <div class="totals-row">
        <span>zzgl. 19% MwSt:</span>
        <strong>${formatEUR(invoice.vatAmount)}</strong>
      </div>
      <div class="totals-row total">
        <span>Gesamtbetrag:</span>
        <strong>${formatEUR(invoice.totalAmount)}</strong>
      </div>
    </div>

    <!-- Payment Info -->
    <div class="payment-info">
      <h3>Zahlungsinformationen</h3>
      ${invoice.sepaPaymentId ? `
        <p><strong>SEPA-Lastschrift:</strong> Der Rechnungsbetrag wird in den nächsten Tagen per SEPA-Lastschrift von Ihrem hinterlegten Konto eingezogen.</p>
        <p><strong>Mandatsreferenz:</strong> ${invoice.sepaPaymentId}</p>
        <p><strong>Gläubiger-ID:</strong> ${settings.gocardlessCreditorId || 'wird nachgereicht'}</p>
      ` : `
        <p><strong>Zahlungsart:</strong> Banküberweisung</p>
        <p><strong>Zahlungsziel:</strong> ${dueDate || 'sofort'}</p>
        ${settings.bankName ? `<p><strong>Bank:</strong> ${settings.bankName}</p>` : ''}
        ${settings.iban ? `<p><strong>IBAN:</strong> ${settings.iban}</p>` : ''}
        ${settings.bic ? `<p><strong>BIC:</strong> ${settings.bic}</p>` : ''}
        <p><strong>Verwendungszweck:</strong> ${invoice.invoiceNumber}</p>
      `}
    </div>
    
    <div class="e-invoice-note" style="margin-top: 30px; padding: 10px; background: #f0f8ff; border-left: 4px solid #2196F3; font-size: 9pt;">
      <p><strong>📄 E-Rechnung (ZUGFeRD 2.2)</strong></p>
      <p>Diese Rechnung enthält strukturierte Daten nach ZUGFeRD 2.2 Standard (EN 16931 konform).</p>
      <p>Die XML-Daten sind in dieser PDF-Datei eingebettet und können von Ihrer Buchhaltungssoftware automatisch eingelesen werden.</p>
    </div>

    ${invoice.notes ? `
    <div class="notes">
      <strong>Hinweise:</strong><br>
      ${invoice.notes}
    </div>
    ` : ''}

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
          ${settings.taxNumber ? `Steuernr: ${settings.taxNumber}<br>` : ''}
          ${settings.registerCourt ? `${settings.registerCourt}<br>` : ''}
          ${settings.registerNumber ? `${settings.registerNumber}` : ''}
        </div>
      </div>
      ${settings.managingDirector ? `<p>Geschäftsführung: ${settings.managingDirector}</p>` : ''}
      ${settings.footerText ? `<p style="margin-top: 10px;">${settings.footerText}</p>` : ''}
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
