const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text) from 1 for 25),
        "companyName" TEXT NOT NULL DEFAULT 'Bereifung24 GmbH',
        "companyAddress" TEXT,
        "companyPhone" TEXT,
        "companyEmail" TEXT,
        "taxNumber" TEXT,
        "vatNumber" TEXT,
        "accountantName" TEXT,
        "accountantEmail" TEXT,
        "accountantCompany" TEXT,
        "accountantAddress" TEXT,
        "accountantPhone" TEXT,
        "accountantTaxNumber" TEXT,
        "smtpHost" TEXT,
        "smtpPort" TEXT,
        "smtpUser" TEXT,
        "smtpPassword" TEXT,
        "smtpFrom" TEXT,
        "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table company_settings created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
