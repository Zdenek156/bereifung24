const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumns() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE co2_settings 
      ADD COLUMN IF NOT EXISTS "co2PerLiterPetrol" INTEGER NOT NULL DEFAULT 2320,
      ADD COLUMN IF NOT EXISTS "co2PerLiterDiesel" INTEGER NOT NULL DEFAULT 2640,
      ADD COLUMN IF NOT EXISTS "co2PerLiterLPG" INTEGER NOT NULL DEFAULT 1640,
      ADD COLUMN IF NOT EXISTS "co2PerKgCNG" INTEGER NOT NULL DEFAULT 1990,
      ADD COLUMN IF NOT EXISTS "petrolPricePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 1.75,
      ADD COLUMN IF NOT EXISTS "lpgPricePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
      ADD COLUMN IF NOT EXISTS "cngPricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 1.10
    `);
    console.log('✅ Fuel-specific CO2 columns added successfully');
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();
