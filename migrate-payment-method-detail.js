// Quick migration script to add payment_method_detail column
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('🔄 Checking if payment_method_detail column exists...')
    
    // Try to add the column (PostgreSQL will error if it already exists)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE direct_bookings 
      ADD COLUMN IF NOT EXISTS payment_method_detail VARCHAR(50);
    `)
    
    console.log('✅ Column payment_method_detail ensured in direct_bookings')
    
    // Set default values for existing STRIPE payments
    const result = await prisma.$executeRaw`
      UPDATE direct_bookings 
      SET payment_method_detail = 'card'
      WHERE payment_method = 'STRIPE' 
        AND payment_method_detail IS NULL
        AND payment_status = 'PAID'
    `
    
    console.log(`✅ Updated ${result} existing STRIPE payments to default "card"`)
    console.log('🎉 Migration complete!')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
