#!/usr/bin/env node

/**
 * Quick Invoice System Test
 * Tests invoice generation locally without database
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Quick Invoice System Test\n');

// Test 1: Check required files exist
console.log('[1/6] Checking files...');
const requiredFiles = [
  'lib/invoicing/invoiceService.ts',
  'lib/invoicing/invoiceAccountingService.ts',
  'lib/invoicing/invoicePdfService.ts',
  'app/api/cron/generate-commission-invoices/route.ts',
  'migration_add_commission_invoicing.sql',
  'migration_commission_invoice_email_template.sql'
];

let filesOk = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} NOT FOUND`);
    filesOk = false;
  }
}

if (!filesOk) {
  console.log('\n❌ Some files are missing!');
  process.exit(1);
}

// Test 2: Check puppeteer
console.log('\n[2/6] Checking puppeteer...');
try {
  require('puppeteer');
  console.log('  ✓ puppeteer installed');
} catch (err) {
  console.log('  ✗ puppeteer not installed');
  console.log('    Run: npm install puppeteer');
  process.exit(1);
}

// Test 3: Check invoice directory
console.log('\n[3/6] Checking directories...');
const invoiceDir = path.join(process.cwd(), 'public', 'invoices');
if (!fs.existsSync(invoiceDir)) {
  console.log('  ⚠ Creating invoice directory...');
  fs.mkdirSync(invoiceDir, { recursive: true });
}
console.log(`  ✓ ${invoiceDir}`);

// Test 4: Check environment variables
console.log('\n[4/6] Checking environment variables...');
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  
  const checkVar = (name) => {
    if (envContent.includes(`${name}=`)) {
      console.log(`  ✓ ${name} is set`);
      return true;
    } else {
      console.log(`  ⚠ ${name} not found`);
      return false;
    }
  };
  
  checkVar('DATABASE_URL');
  checkVar('NEXTAUTH_SECRET');
  checkVar('SMTP_HOST');
  checkVar('CRON_SECRET') || console.log('    Add: CRON_SECRET=' + require('crypto').randomBytes(32).toString('base64'));
  
} else {
  console.log('  ⚠ .env.local not found');
}

// Test 5: Test PDF generation (mock)
console.log('\n[5/6] Testing PDF generation...');
(async () => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Simple HTML test
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Invoice</title></head>
        <body>
          <h1>Test Invoice B24-INV-2026-0001</h1>
          <table>
            <tr><th>Position</th><th>Beschreibung</th><th>Betrag</th></tr>
            <tr><td>1</td><td>Reifenmontage</td><td>100,00 €</td></tr>
          </table>
          <p>Gesamtbetrag: 119,00 € (inkl. 19% MwSt)</p>
        </body>
      </html>
    `);
    
    const testPdfPath = path.join(invoiceDir, 'test.pdf');
    await page.pdf({
      path: testPdfPath,
      format: 'A4',
      printBackground: true
    });
    
    await browser.close();
    
    const stats = fs.statSync(testPdfPath);
    if (stats.size > 0) {
      console.log(`  ✓ PDF generated: ${testPdfPath} (${stats.size} bytes)`);
      fs.unlinkSync(testPdfPath); // Cleanup
    } else {
      console.log('  ✗ PDF generation failed (empty file)');
      process.exit(1);
    }
    
  } catch (err) {
    console.log('  ✗ PDF generation failed:', err.message);
    process.exit(1);
  }
  
  // Test 6: Check database connection (optional)
  console.log('\n[6/6] Checking database connection...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('  ✓ Database connection successful');
    
    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%invoice%'
    `;
    
    if (tables && tables.length > 0) {
      console.log('  ✓ Invoice tables found:');
      tables.forEach(t => console.log(`    - ${t.table_name}`));
    } else {
      console.log('  ⚠ Invoice tables not found (run migrations)');
    }
    
    await prisma.$disconnect();
    
  } catch (err) {
    console.log('  ⚠ Database connection failed:', err.message);
    console.log('    (This is OK if database is not running locally)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests passed!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. Run migrations on production');
  console.log('2. Deploy: ./scripts/deploy-invoice-system.sh');
  console.log('3. Configure invoice settings via admin UI');
  console.log('4. Setup cron: ./scripts/setup-cron-job.sh');
  console.log('5. Test: curl https://bereifung24.de/api/admin/invoices/settings');
  console.log('');
  
})();
