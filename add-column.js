// Add column directly via raw SQL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumn() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE tire_requests ADD COLUMN IF NOT EXISTS "workshopsNotified" INTEGER'
    );
    console.log('✅ Column workshopsNotified added successfully');
  } catch (error) {
    console.error('Error adding column:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addColumn();
