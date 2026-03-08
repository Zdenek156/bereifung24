const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE tire_catalog ADD COLUMN IF NOT EXISTS construction VARCHAR')
    console.log('✅ Column "construction" added to tire_catalog')
    
    // Verify
    const count = await prisma.$queryRawUnsafe('SELECT COUNT(*) as total FROM tire_catalog')
    console.log('Total tires in catalog:', count)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
