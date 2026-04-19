const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

/**
 * Regenerate all invoice PDFs that are missing
 * Run on server: node regenerate-invoices.js
 */
async function main() {
  const prisma = new PrismaClient();
  
  try {
    const invoices = await prisma.commissionInvoice.findMany({
      where: { pdfUrl: { not: null } },
      select: { id: true, invoiceNumber: true, pdfUrl: true, status: true },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${invoices.length} invoices to check/regenerate`);

    // Import the generate function dynamically
    const { generateInvoicePdf } = require('./lib/invoicing/invoicePdfService');

    let regenerated = 0;
    let failed = 0;

    for (const invoice of invoices) {
      try {
        console.log(`Regenerating ${invoice.invoiceNumber}...`);
        const pdfUrl = await generateInvoicePdf(invoice.id);
        console.log(`  ✅ ${pdfUrl}`);
        regenerated++;
      } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
        failed++;
      }
    }

    console.log(`\nDone: ${regenerated} regenerated, ${failed} failed`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
