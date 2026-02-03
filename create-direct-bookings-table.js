const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Creating DirectBooking table...')
  
  try {
    // Create table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "direct_bookings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "customer_id" TEXT NOT NULL,
        "workshop_id" TEXT NOT NULL,
        "service_type" TEXT NOT NULL,
        "vehicle_id" TEXT NOT NULL,
        "has_balancing" BOOLEAN NOT NULL DEFAULT false,
        "has_storage" BOOLEAN NOT NULL DEFAULT false,
        "base_price" DECIMAL(10,2) NOT NULL,
        "balancing_price" DECIMAL(10,2),
        "storage_price" DECIMAL(10,2),
        "total_price" DECIMAL(10,2) NOT NULL,
        "duration_minutes" INTEGER NOT NULL,
        "date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "time" VARCHAR(5) NOT NULL DEFAULT '09:00',
        "status" VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
        "reserved_until" TIMESTAMP,
        "payment_method" TEXT,
        "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
        "payment_id" VARCHAR(255),
        "stripe_session_id" TEXT,
        "stripe_payment_id" TEXT,
        "paypal_order_id" TEXT,
        "paid_at" TIMESTAMP,
        "booking_id" TEXT UNIQUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table created')
    
    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "direct_bookings_customer_id_idx" ON "direct_bookings"("customer_id")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "direct_bookings_workshop_id_idx" ON "direct_bookings"("workshop_id")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "direct_bookings_payment_status_idx" ON "direct_bookings"("payment_status")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "direct_bookings_workshop_date_time_idx" ON "direct_bookings"("workshop_id", "date", "time")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "direct_bookings_status_idx" ON "direct_bookings"("status")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "direct_bookings_created_at_idx" ON "direct_bookings"("created_at")`)
    console.log('✅ Indexes created')
    
    console.log('🎉 DirectBooking table setup complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    // Continue even if table exists
    if (!error.message.includes('already exists')) {
      process.exit(1)
    }
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
