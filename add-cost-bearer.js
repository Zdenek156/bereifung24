const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Adding cost_bearer columns...')
  
  // Add cost_bearer to coupons table
  await prisma.$executeRawUnsafe(`
    ALTER TABLE coupons ADD COLUMN IF NOT EXISTS cost_bearer TEXT DEFAULT 'PLATFORM'
  `)
  console.log('✅ Added cost_bearer to coupons')
  
  // Add coupon_cost_bearer to direct_bookings table
  await prisma.$executeRawUnsafe(`
    ALTER TABLE direct_bookings ADD COLUMN IF NOT EXISTS coupon_cost_bearer TEXT
  `)
  console.log('✅ Added coupon_cost_bearer to direct_bookings')
  
  console.log('✅ All columns added successfully!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
