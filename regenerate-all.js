/**
 * Regenerate all invoice PDFs by calling the generate-pdf API endpoint
 * Run on server: node regenerate-all.js
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const invoices = await prisma.commissionInvoice.findMany({
      select: { id: true, invoiceNumber: true, pdfUrl: true },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${invoices.length} invoices to regenerate\n`);

    // We can't easily call the PDF service from a standalone script
    // because it uses ES module paths. Instead, trigger via HTTP.
    const baseUrl = 'http://localhost:3000';
    
    // First get a session - we need to call the generate endpoint
    // Actually, let's just directly use puppeteer + the service
    // We need to transpile. Let's use a different approach:
    // Call the API with a admin cookie

    // Simplest: use node's built-in fetch to call the generate-pdf endpoint
    // But we need auth. Let's just re-implement the core logic here.
    
    const puppeteer = require('puppeteer');
    const fs = require('fs');
    const path = require('path');

    const DATA_DIR = '/var/www/bereifung24-data/invoices';

    // Load logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'B24 Logo transparent.png');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
        console.log('Logo loaded as base64');
      }
    } catch(e) {}

    const settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' }
    });

    if (!settings) {
      console.error('No invoice settings found');
      return;
    }

    let success = 0, failed = 0;

    for (const inv of invoices) {
      try {
        // Get full invoice data
        const invoice = await prisma.commissionInvoice.findUnique({
          where: { id: inv.id },
          include: {
            workshop: {
              select: {
                companyName: true,
                taxId: true,
                user: {
                  select: { email: true, phone: true, street: true, zipCode: true, city: true }
                }
              }
            }
          }
        });

        if (!invoice) { failed++; continue; }

        const year = invoice.periodEnd.getFullYear();
        const month = String(invoice.periodEnd.getMonth() + 1).padStart(2, '0');
        const outputDir = path.join(DATA_DIR, String(year), month);
        fs.mkdirSync(outputDir, { recursive: true });

        const filename = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
        const outputPath = path.join(outputDir, filename);

        // Generate HTML
        const html = generateHtml(invoice, settings, logoBase64);

        // Generate PDF with puppeteer
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
          path: outputPath,
          format: 'A4',
          margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
          printBackground: true
        });
        await browser.close();

        // Update pdfUrl in DB
        const pdfUrl = `/invoices/${year}/${month}/${filename}`;
        await prisma.commissionInvoice.update({
          where: { id: inv.id },
          data: { pdfUrl }
        });

        console.log(`✅ ${invoice.invoiceNumber} -> ${pdfUrl}`);
        success++;
      } catch (err) {
        console.error(`❌ ${inv.invoiceNumber}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\nDone: ${success} regenerated, ${failed} failed`);
  } finally {
    await prisma.$disconnect();
  }
}

function generateHtml(invoice, settings, logoBase64) {
  const lineItems = invoice.lineItems || [];
  const invoiceDate = invoice.createdAt.toLocaleDateString('de-DE');
  
  const periodStartDate = new Date(invoice.periodStart);
  periodStartDate.setDate(1);
  const periodStart = periodStartDate.toLocaleDateString('de-DE');
  
  const periodEndDate = new Date(invoice.periodEnd);
  const lastDay = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 0).getDate();
  periodEndDate.setDate(lastDay);
  const periodEnd = periodEndDate.toLocaleDateString('de-DE');

  const paymentLabel = invoice.paymentMethod === 'SEPA' ? 'SEPA-Lastschrift' : 'Stripe (Automatisch)';

  const formatEUR = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><title>Rechnung ${invoice.invoiceNumber}</title>
<style>
@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Helvetica,Arial,sans-serif;font-size:10pt;color:#0f172a;line-height:1.5;position:relative;width:210mm;min-height:297mm}
body::before{content:'';position:fixed;left:0;top:0;width:8pt;height:100%;background:linear-gradient(to bottom,#0284C7 calc(100% - 75pt),#2BAAE2 calc(100% - 75pt));z-index:10}
.container{margin-left:20pt;margin-right:40pt;padding-top:40pt;padding-bottom:30pt;position:relative}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14pt}
.header-left{flex:1}
.company-name-img{max-width:180px;max-height:50px;margin-bottom:6pt}
.company-name{font-weight:bold;font-size:20pt;color:#0284C7;line-height:1.2;margin-bottom:6pt}
.sender-line{font-size:7.5pt;color:#64748b;line-height:1.3}
.header-right{text-align:right;padding-top:4pt}
.invoice-label{font-weight:bold;font-size:9pt;color:#0f172a;margin-bottom:3pt}
.invoice-number{font-weight:bold;font-size:12pt;color:#0f172a;margin-bottom:3pt}
.invoice-date{font-size:9pt;color:#64748b}
.divider{height:0.5pt;background-color:#e2e8f0;margin:14pt 0}
.two-columns{display:flex;justify-content:space-between;margin-bottom:18pt}
.recipient-section{flex:1}
.recipient-label{font-size:7.5pt;color:#94a3b8;margin-bottom:6pt}
.recipient-name{font-weight:bold;font-size:13pt;color:#0f172a;margin-bottom:3pt}
.recipient-address{font-size:10pt;color:#64748b;line-height:1.5}
.metadata-section{min-width:220pt}
.meta-row{display:flex;justify-content:space-between;gap:16pt;margin-bottom:8pt;font-size:8pt}
.meta-row .label{color:#64748b}.meta-row .value{font-weight:bold;color:#0f172a;text-align:right}
.intro-text{font-size:9pt;color:#64748b;margin-bottom:14pt;line-height:1.5}
.invoice-table{width:100%;border-collapse:collapse;margin:0 0 16pt 0}
.invoice-table thead th{font-weight:bold;font-size:8pt;color:#0284C7;text-align:left;padding:0 4pt 6pt 4pt;border-bottom:1.5pt solid #0284C7;white-space:nowrap}
.invoice-table thead th.text-right{text-align:right}
.invoice-table tbody tr{border-bottom:0.3pt solid #f1f5f9}
.invoice-table tbody tr:last-child{border-bottom:0.5pt solid #e2e8f0}
.invoice-table tbody td{padding:8pt 4pt;font-size:9pt;vertical-align:top}
.invoice-table tbody td.text-right{text-align:right}
.invoice-table tbody td.pos{color:#0f172a}
.invoice-table tbody td.date-col{color:#64748b}
.invoice-table tbody td.description{color:#0f172a}
.invoice-table tbody td.quantity{color:#64748b;text-align:right}
.invoice-table tbody td.unit-price{color:#64748b;text-align:right}
.invoice-table tbody td.total-col{font-weight:bold;color:#0f172a;text-align:right}
.totals{margin:8pt 0 16pt auto;width:240pt}
.totals-row{display:flex;justify-content:space-between;margin-bottom:8pt;font-size:9pt}
.totals-row .label{color:#64748b}.totals-row .value{color:#0f172a;text-align:right}
.totals-total{border-top:1pt solid #0284C7;padding-top:10pt;margin-top:8pt}
.totals-total .label,.totals-total .value{font-weight:bold;font-size:13pt;color:#0284C7}
.payment-info{background-color:#e0f2fe;border-radius:8pt;padding:12pt 16pt;margin:16pt 0}
.payment-info h3{font-weight:bold;font-size:8pt;color:#065986;margin-bottom:6pt}
.payment-info p{font-size:8pt;color:#64748b;margin:3pt 0;line-height:1.4}
.zugferd-note{font-size:7pt;color:#94a3b8;margin:16pt 0;line-height:1.3}
.footer{margin-top:30pt;padding-top:12pt;border-top:0.5pt solid #e2e8f0;font-size:7pt;color:#64748b;line-height:1.5}
.footer-columns{display:grid;grid-template-columns:repeat(2,1fr);gap:20pt}
.footer-column h4{font-weight:bold;font-size:7pt;color:#64748b;margin-bottom:4pt}
</style></head><body><div class="container">
<div class="header"><div class="header-left">
${logoBase64 ? `<img src="${logoBase64}" alt="${settings.companyName}" class="company-name-img">` : `<div class="company-name">${settings.companyName || 'Bereifung24'}</div>`}
<div class="sender-line">${settings.companyStreet || settings.street || ''} | ${settings.companyZip || settings.zip || ''} ${settings.companyCity || settings.city || ''} | Tel: ${settings.phone || ''} | ${settings.email || ''}</div>
</div><div class="header-right"><div class="invoice-label">RECHNUNG</div><div class="invoice-number">${invoice.invoiceNumber}</div><div class="invoice-date">Datum: ${invoiceDate}</div></div></div>
<div class="divider"></div>
<div class="two-columns"><div class="recipient-section"><div class="recipient-label">An:</div><div class="recipient-name">${invoice.workshop.companyName}</div><div class="recipient-address">${invoice.workshop.user?.street ? `${invoice.workshop.user.street}<br>` : ''}${invoice.workshop.user?.zipCode && invoice.workshop.user?.city ? `${invoice.workshop.user.zipCode} ${invoice.workshop.user.city}` : ''}</div></div>
<div class="metadata-section"><div class="meta-row"><span class="label">Leistungszeitraum:</span><span class="value">${periodStart} - ${periodEnd}</span></div><div class="meta-row"><span class="label">Zahlungsart:</span><span class="value">${paymentLabel}</span></div><div class="meta-row"><span class="label">USt-IdNr:</span><span class="value">${settings.taxId || 'N/A'}</span></div></div></div>
<div class="intro-text">Sehr geehrte Damen und Herren,<br>für die im Leistungszeitraum erbrachten Vermittlungsleistungen stellen wir Ihnen folgende Positionen in Rechnung:</div>
<table class="invoice-table"><thead><tr><th style="width:35pt">Pos.</th><th style="width:75pt">Datum</th><th>Beschreibung</th><th class="text-right" style="width:45pt">Menge</th><th class="text-right" style="width:75pt">Einzelpreis</th><th class="text-right" style="width:75pt">Gesamt</th></tr></thead><tbody>
${lineItems.map((item, index) => `<tr><td class="pos">${index + 1}</td><td class="date-col">${item.date ? new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td><td class="description">${item.description || 'Provision'}</td><td class="quantity">${item.quantity || 1}</td><td class="unit-price">${formatEUR(item.unitPrice || 0)}</td><td class="total-col">${formatEUR(item.total || 0)}</td></tr>`).join('')}
</tbody></table>
<div class="totals"><div class="totals-row"><span class="label">Nettobetrag:</span><span class="value">${formatEUR(invoice.subtotal)}</span></div><div class="totals-row"><span class="label">zzgl. 19% MwSt:</span><span class="value">${formatEUR(invoice.vatAmount)}</span></div><div class="totals-row totals-total"><span class="label">Gesamtbetrag:</span><span class="value">${formatEUR(invoice.totalAmount)}</span></div></div>
<div class="payment-info"><h3>Zahlung per ${paymentLabel}</h3>${invoice.paymentMethod === 'SEPA' ? `<p>IBAN: ${settings.iban || ''} | BIC: ${settings.bic || ''} | Verwendungszweck: ${invoice.invoiceNumber}</p><p>Der Rechnungsbetrag wird automatisch per SEPA-Lastschrift abgebucht.</p>` : `<p><strong>Rechnungsnummer:</strong> ${invoice.invoiceNumber}</p><p>Die Provision wurde bereits automatisch über Stripe einbehalten.</p>`}</div>
<div class="zugferd-note">E-Rechnung (ZUGFeRD 2.2) — Strukturierte Daten nach EN 16931 sind in dieser PDF eingebettet.</div>
<div class="footer"><div class="footer-columns"><div class="footer-column"><h4>Kontakt</h4>${settings.phone || ''}<br>${settings.email || ''}<br>${settings.website || ''}</div><div class="footer-column"><h4>Steuern</h4>${settings.taxId ? `USt-IdNr: ${settings.taxId}<br>` : ''}${settings.managingDirector ? `Geschäftsführung: ${settings.managingDirector}` : ''}</div></div></div>
</div></body></html>`;
}

main();
