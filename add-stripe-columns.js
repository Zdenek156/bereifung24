const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addStripeColumns() {
  try {
    console.log('🔧 Adding Stripe columns to workshops table...')
    
    await prisma.$executeRaw`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS stripe_account_id TEXT`
    console.log('✅ Added stripe_account_id column')
    
    await prisma.$executeRaw`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN NOT NULL DEFAULT false`
    console.log('✅ Added stripe_enabled column')
    
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addStripeColumns()
