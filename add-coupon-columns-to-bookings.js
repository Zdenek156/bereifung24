const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Add coupon columns to direct_bookings table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE direct_bookings 
      ADD COLUMN IF NOT EXISTS coupon_id TEXT,
      ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2)
    `)
    console.log('✅ Coupon columns added to direct_bookings table')
    
    // Verify columns exist
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'direct_bookings' 
      AND column_name IN ('coupon_id', 'coupon_code', 'discount_amount', 'original_price')
      ORDER BY column_name
    `)
    console.log('📋 Columns verified:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
