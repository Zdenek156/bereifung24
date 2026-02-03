const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Adding missing fields to DirectBooking table...')
  
  try {
    // Execute raw SQL to add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "date" DATE NOT NULL DEFAULT CURRENT_DATE;
    `)
    console.log('✅ Added "date" column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "time" VARCHAR(5) NOT NULL DEFAULT '09:00';
    `)
    console.log('✅ Added "time" column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'RESERVED';
    `)
    console.log('✅ Added "status" column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "reserved_until" TIMESTAMP;
    `)
    console.log('✅ Added "reserved_until" column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "payment_id" VARCHAR(255);
    `)
    console.log('✅ Added "payment_id" column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "direct_bookings" ALTER COLUMN "payment_method" DROP NOT NULL;
    `)
    console.log('✅ Made "payment_method" nullable')
    
    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "direct_bookings_workshop_date_time_idx" 
      ON "direct_bookings"("workshop_id", "date", "time");
    `)
    console.log('✅ Created composite index for slot lookups')
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "direct_bookings_status_idx" 
      ON "direct_bookings"("status");
    `)
    console.log('✅ Created status index')
    
    console.log('\n🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error during migration:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
